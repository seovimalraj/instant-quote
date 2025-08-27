/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';
const files = globSync('src/app/api/**/route.{ts,tsx}', { nodir: true, windowsPathsNoEscape: true });
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (!/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(s)) {
    s = s.replace(/export\s+const\s+runtime\s*=\s*['"][^'"]+['"];?\s*/g, '');
    s = `export const runtime = 'nodejs'\n` + s;
    fs.writeFileSync(f, s);
    console.log('Set runtime=nodejs ->', f);
  }
}
