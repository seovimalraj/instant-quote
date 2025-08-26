/* eslint-env node */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url) + "/../..");
const F = (p) => path.join(root, p);

const findings = {
  environment: [],
  apiRoutes: [],
  pages: [],
  config: [],
  summary: { errors: 0, warnings: 0 },
};

function add(kind, level, file, message, detail) {
  findings[kind].push({ level, file, message, detail });
  if (level === "error") findings.summary.errors++;
  if (level === "warn") findings.summary.warnings++;
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(F(p), "utf8")); } catch { return null; }
}

function walk(dir, exts = [".ts", ".tsx"]) {
  const out = [];
  const base = F(dir);
  if (!fs.existsSync(base)) return out;
  (function rec(d) {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) rec(p);
      else if (exts.includes(path.extname(p))) out.push(p);
    }
  })(base);
  return out;
}

/* ---------------------- 1) Environment / engines check -------------------- */
const pkg = readJSON("package.json");
if (pkg?.engines?.node) {
  const required = pkg.engines.node;
  const current = process.version; // e.g. v22.18.0
  if (!current) {
    add("environment", "warn", "process.version", "Cannot read current Node version");
  } else {
    // quick nudge only (semver is overkill here)
    const wantMajor = (required.match(/\d+/) || [null])[0];
    const haveMajor = current.split(".")[0].replace("v", "");
    if (wantMajor && haveMajor && wantMajor !== haveMajor) {
      add("environment", "error", "package.json#engines", `Node mismatch: requires "${required}" but running "${current}"`);
    }
  }
} else {
  add("environment", "warn", "package.json#engines", "No Node engine set; set one to match Vercel");
}

/* ---------------------- 2) Config sanity (Vercel & npm) ------------------- */
const vercel = readJSON("vercel.json");
if (vercel?.functions) {
  // Next App Router auto-discovers API routes; function globs often cause “unmatched pattern” on Vercel
  add(
    "config",
    "warn",
    "vercel.json",
    "Found `functions` key. Next.js App Router usually doesn’t need this; can trigger unmatched pattern errors.",
    "Consider removing `functions` or ensure patterns actually match /app/api/**/route.ts"
  );
}
if (fs.existsSync(F(".npmrc"))) {
  const npmrc = fs.readFileSync(F(".npmrc"), "utf8");
  if (/^http-proxy\s*=|^https-proxy\s*=/m.test(npmrc)) {
    add("config", "warn", ".npmrc", "Detected http-proxy/https-proxy settings; npm warns these may stop working in future.");
  }
}

/* ---------------------- 3) API route health (Next 15 rules) --------------- */
const apiFiles = walk("src/app/api");
for (const file of apiFiles.filter(f => /route\.tsx?$/.test(f))) {
  const s = fs.readFileSync(file, "utf8");
  // a) runtime guard
  if (!/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(s)) {
    add("apiRoutes", "warn", file, "Missing `export const runtime = 'nodejs'` (prevents Edge+Supabase warnings).");
  }
  // b) second arg must be inline typed context with params (no custom alias)
  // e.g. export async function GET(req: Request, { params }: { params: { id: string }})
  const badCtx = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*\([\s\S]*?\{\s*params\s*:\s*[A-Za-z_]\w*/m;
  if (badCtx.test(s)) {
    add("apiRoutes", "error", file, "Invalid route context type", "Second arg must be inline typed: { params: { ... } } (no custom alias)");
  }
}

/* ---------------------- 4) Page props (Next 15 signatures) ---------------- */
const pageFiles = walk("src/app").filter(f => /page\.tsx?$/.test(f));
for (const file of pageFiles) {
  const s = fs.readFileSync(file, "utf8");
  // a) direct PageProps import is gone
  if (/PageProps/.test(s)) {
    add("pages", "error", file, "Uses removed Next type `PageProps`", "Use inline `{ params?: any; searchParams?: any }` typing");
  }
  // b) Props with synchronous searchParams often breaks (must tolerate Promise in Next 15)
  if (/interface\s+Props[\s\S]*searchParams:\s*\{/.test(s) && /export\s+default\s+async\s+function\s+\w+\s*\(\s*\{\s*searchParams\s*\}\s*:\s*Props\s*\)/.test(s)) {
    add("pages", "warn", file, "Props defines sync searchParams; Next 15 may pass Promises", "Use `{ params?: any; searchParams?: any }` or await-resolve pattern");
  }
}

/* ---------------------- 5) Supabase in Edge (warning detector) ------------ */
for (const file of apiFiles) {
  const s = fs.readFileSync(file, "utf8");
  if (/@supabase\/ssr|@supabase\/supabase-js/.test(s) && !/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(s)) {
    add("apiRoutes", "warn", file, "Supabase used without `runtime='nodejs'`", "This produces Edge runtime warnings during `next build`");
  }
}

/* ---------------------- 6) Output report --------------------------------- */
const outPath = F("diagnostics.json");
fs.writeFileSync(outPath, JSON.stringify(findings, null, 2));
const badge = (n, label, color) => `\x1b[1m\x1b[${color}m${n} ${label}\x1b[0m`;
console.log(
  `\nDiagnostics complete → diagnostics.json  ${badge(findings.summary.errors, "errors", 31)}  ${badge(findings.summary.warnings, "warnings", 33)}\n`
);
for (const section of ["environment", "config", "apiRoutes", "pages"]) {
  if (!findings[section].length) continue;
  console.log(`• ${section}`);
  for (const item of findings[section]) {
    const color = item.level === "error" ? 31 : 33;
    console.log(`  - \x1b[${color}m[${item.level}]\x1b[0m ${item.file}: ${item.message}`);
  }
}
