/* eslint-env node */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { globSync } from 'glob';

function sh(cmd) {
  try { return execSync(cmd, { stdio: ['ignore','pipe','pipe'] }).toString(); } catch (e) { return e.stdout?.toString() || e.message; }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

// Collect Next.js routes
const pageFiles = globSync('src/app/**/page.{ts,tsx}', { ignore: ['**/node_modules/**'] });
const apiFiles  = globSync('src/app/api/**/route.{ts,tsx}', { ignore: ['**/node_modules/**'] });

function classifyRoute(p) {
  const isAdmin = p.includes('/app/admin/');
  const isCustomer = p.includes('/app/(customer)/') || (!isAdmin && !p.includes('/app/admin/'));
  return { isAdmin, isCustomer };
}

const pages = pageFiles.map(p => ({ path: p, ...classifyRoute(p) }));
const apis  = apiFiles.map(p => ({ path: p }));

// LoC via fallback approach (prefer cloc if installed)
let loc; 
if (sh('command -v cloc >/dev/null 2>&1 && echo found || echo missing').includes('found')) {
  loc = sh('cloc --json --quiet src || true');
} else {
  const count = sh("find src -type f -name '*.*' -not -path '*/node_modules/*' -print0 | xargs -0 cat | wc -l").trim();
  loc = JSON.stringify({ summary: { total_lines: Number(count) } });
}

// Build dry-run warning scan (no lint, to speed up). We mock by reading previous logs if present.
const buildWarns = [];
try {
  const log = sh('NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS= node -e "console.log()" && npm run -s verify:strict');
  if (/Edge Runtime/i.test(log) && /@supabase\/(realtime-js|supabase-js)/.test(log)) buildWarns.push('EDGE_SUPABASE_WARNING');
} catch (e) {
  // ignore; verify:strict may fail for missing envs; still capture stdout
}

// Feature flags (best-effort static detection)
const features = {
  dfmEngine: fs.existsSync('src/components/dfm') || fs.existsSync('src/lib/dfm'),
  cadViewer: fs.existsSync('src/components/viewer') || fs.existsSync('src/components/CadViewer.tsx'),
  stlSupport: !!deps['three'] || !!deps['three-stdlib'],
  stepIgesSupport: !!deps['occt-import-js'],
  authEmailPassword: fs.existsSync('src') ? false : true // fallback; refined below
};

// Refine auth detection by scanning for /api/auth/signin or sign-up handlers referencing email/password
const authHits = globSync('src/**/*.{ts,tsx}').flatMap(p=>{
  try { const s = fs.readFileSync(p,'utf8'); return /auth\.sign(In|Up)\(\{\s*email:\s*.*password:/s.test(s) ? [p] : []; } catch { return []; }
});
features.authEmailPassword = authHits.length > 0;

// TailAdmin integration detection (layout imports, component classes)
const tailAdmin = globSync('src/**/*.{ts,tsx}').some(p=>{
  try { const s = fs.readFileSync(p,'utf8'); return /tailadmin|TailAdmin|ta-/.test(s); } catch { return false; }
});

const result = {
  node_required: pkg.engines?.node || null,
  next_version: deps.next || null,
  pages,
  apis,
  loc_json: JSON.parse(loc),
  build_warnings: buildWarns,
  features: { ...features, tailAdmin }
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/audit.json', JSON.stringify(result, null, 2));
console.log('Wrote tmp/audit.json');
