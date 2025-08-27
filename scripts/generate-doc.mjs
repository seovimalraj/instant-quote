/* eslint-env node */
import fs from 'node:fs';

const audit = JSON.parse(fs.readFileSync('tmp/audit.json', 'utf8'));

function boolBadge(b){ return b ? '✅' : '⚠️'; }

// Compute LoC summary (works with cloc json or simple summary)
let totalLines = null;
if (audit.loc_json?.header?.n_files !== undefined) {
  totalLines = Object.values(audit.loc_json).reduce((acc, v)=> (v.code? acc+v.code: acc), 0);
}
if (!totalLines && audit.loc_json?.summary?.total_lines) totalLines = audit.loc_json.summary.total_lines;

const adminPages = audit.pages.filter(p=>p.isAdmin).map(p=>p.path.replace('src/app',''));
const customerPages = audit.pages.filter(p=>p.isCustomer && !p.isAdmin).map(p=>p.path.replace('src/app',''));
const apiRoutes = audit.apis.map(a=>a.path.replace('src/app',''));

// Known workflows (static + feature flags)
const works = [];
if (audit.features.cadViewer) works.push('3D viewer renders STL (browser)');
if (audit.features.stepIgesSupport) works.push('STEP/IGES tessellation via occt-import-js (WASM)');
if (audit.features.dfmEngine) works.push('DFM engine returns suggestions based on geometry/material/finish/tolerance');
if (audit.features.authEmailPassword) works.push('Email/Password auth flows wired');

const caveats = [];
if (!audit.features.authEmailPassword) caveats.push('Signup/Login: magic-link or incomplete email/password flow—verify Supabase auth handlers.');
if (audit.build_warnings.includes('EDGE_SUPABASE_WARNING')) caveats.push('Use Node runtime for all API routes to avoid Edge+Supabase warnings (export const runtime = "nodejs").');

const md = `# Instant Quote — End-to-End Overview\n\n## At-a-glance\n- Node required (package.json engines): **${audit.node_required || 'unspecified'}**\n- Next.js version: **${audit.next_version || 'unknown'}**\n- Total lines of code (src): **${totalLines ?? 'n/a'}**\n\n## Feature Status\n- CAD Viewer (STL): ${boolBadge(audit.features.cadViewer)}\n- STEP/IGES Support (occt-import-js): ${boolBadge(audit.features.stepIgesSupport)}\n- DFM Engine: ${boolBadge(audit.features.dfmEngine)}\n- Email/Password Auth: ${boolBadge(audit.features.authEmailPassword)}\n- TailAdmin UI integration: ${boolBadge(audit.features.tailAdmin)}\n\n### Working (based on static audit)\n${works.map(w=>`- ${w}`).join('\n') || '- (No positive detections; verify manually)'}\n\n### Needs Attention / Caveats\n${caveats.map(c=>`- ${c}`).join('\n') || '- None detected'}\n\n## Pages\n### Admin\n${adminPages.map(p=>`- \`${p}\``).join('\n') || '- (none found)'}\n\n### Customer\n${customerPages.map(p=>`- \`${p}\``).join('\n') || '- (none found)'}\n\n## API Routes\n${apiRoutes.map(p=>`- \`${p}\``).join('\n') || '- (none found)'}\n\n## Workflows\n1) **Instant Quote**\n   - Upload STL/STEP/IGES → Viewer renders mesh → Geometry analyzed (bbox, area, volume).\n   - Select material, finish, tolerance, quantity, lead time.\n   - Pricing engine computes per-unit, shipping, tax, total; shows breakdown.\n   - DFM engine lists manufacturability notes; actions: Generate QAP, Create Instant Quote.\n\n2) **DFM Engine**\n   - Inputs: CAD + material + purpose + tolerance + certification.\n   - Output: feasibility, alternatives (materials/tolerances), expected lifetime and risks, drawing suggestions.\n\n3) **Admin Panel**\n   - Manage rate cards, materials, finishes, tolerances, machines, quotes, capacity.\n   - Requires authenticated admin role; protect via server checks.\n\n4) **Auth**\n   - Email/password via Supabase Auth (if wired) or magic-link fallback.\n\n## Environment & Secret Requirements\n- **Required (build/runtime):** \n  - \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\` (client)\n  - \`SUPABASE_SERVICE_ROLE_KEY\` (server tasks only; never expose to client)\n- **Vercel**\n  - In Project Settings → Environment Variables, add the above keys.\n  - Ensure \`vercel.json\` or route files export \`runtime = 'nodejs'\` for all API routes.\n\n## Known Build Warnings\n${audit.build_warnings.includes('EDGE_SUPABASE_WARNING') ? '- Edge runtime + Supabase: switch API routes to Node runtime.' : '- None recorded'}\n\n## Dummy Users (for walkthrough)\n- **Admin**: \`admin@example.com\` / \`Passw0rd!\` (seed via script in Prompt 3/3)\n- **Customer**: \`customer@example.com\` / \`Passw0rd!\` (seed via script in Prompt 3/3)\n\n---\n*Generated from \`tmp/audit.json\`.*\n`;

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/END_TO_END.md', md);
console.log('Wrote docs/END_TO_END.md');
