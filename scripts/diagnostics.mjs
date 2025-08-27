/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { globSync } from 'glob';

const problems = [];

// 1) Node version vs engines
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const engines = pkg.engines?.node;
  if (engines) {
    const node = process.versions.node;
    const ok = /^>=\d+/.test(engines) ? true : false;
    if (!ok) problems.push({ level: 'warn', msg: `package.json engines.node is unusual: "${engines}"` });
    if (!new RegExp('^22\\.?').test(node)) {
      problems.push({ level: 'error', msg: `Node ${node} running; project expects ${engines}` });
    }
  }
} catch (e) {
  problems.push({ level: 'error', msg: `Cannot read package.json: ${e.message}` });
}

// 2) API routes must pin Node runtime (avoid Edge + process.* warnings)
const apiRoutes = globSync('src/app/api/**/route.{ts,tsx}', { nodir: true });
for (const f of apiRoutes) {
  const s = fs.readFileSync(f, 'utf8');
  if (!/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(s)) {
    problems.push({ level: 'warn', msg: `Missing "export const runtime = 'nodejs'" in ${f}` });
  }
}

// 3) Next 15 route context signature sanity
for (const f of apiRoutes) {
  const s = fs.readFileSync(f, 'utf8');
  if (/context:\s*{\s*params:\s*Record<string,\s*string>\s*}/.test(s)) {
    problems.push({ level: 'error', msg: `Route uses legacy context type in ${f}. Use { params }: { params: Promise<Record<string,string>> }` });
  }
}

// 4) Pages: avoid importing PageProps from 'next'
const pages = globSync('src/app/**/page.tsx', { nodir: true });
for (const f of pages) {
  const s = fs.readFileSync(f, 'utf8');
  if (/from\s+['"]next['"]\s*;?\s*\n.*PageProps/.test(s)) {
    problems.push({ level: 'error', msg: `Do not import PageProps from 'next'. Use { params?: any; searchParams?: any } and await if Promises. File: ${f}` });
  }
}

// 5) Supabase Edge warnings: browser client or realtime used in API
for (const f of apiRoutes) {
  const s = fs.readFileSync(f, 'utf8');
  if (/from\s+['"]@supabase\/ssr['"]/.test(s) || /@supabase\/realtime-js/.test(s)) {
    problems.push({ level: 'error', msg: `API route imports browser/realtime client in ${f}. Use "@/lib/supabase/server".` });
  }
}

// 6) npm proxy configs that trigger warnings
try {
  const out = execSync('npm config list -l', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  if (/http-proxy\s*=/.test(out) || /https-proxy\s*=/.test(out) || /proxy\s*=/.test(out)) {
    problems.push({ level: 'warn', msg: 'npm proxy settings detected (http-proxy/https-proxy). Consider removing to avoid warnings.' });
  }
} catch {}

// 7) Dependabot invalid config
if (fs.existsSync('.github/dependabot.yml')) {
  const s = fs.readFileSync('.github/dependabot.yml', 'utf8');
  if (/package-ecosystem:\s*["']?\s*["']?$/m.test(s) || /package-ecosystem:\s*$/.test(s)) {
    problems.push({ level: 'error', msg: '.github/dependabot.yml has an empty package-ecosystem. Fix to "npm" etc.' });
  }
}

// Print report
const byLevel = { error: [], warn: [] };
for (const p of problems) byLevel[p.level].push(p.msg);

const header = (t, n) => console.log(`\n=== ${t} (${n}) ===`);
header('Errors', byLevel.error.length);
byLevel.error.forEach((m) => console.log('•', m));
header('Warnings', byLevel.warn.length);
byLevel.warn.forEach((m) => console.log('•', m));

process.exit(byLevel.error.length ? 1 : 0);
