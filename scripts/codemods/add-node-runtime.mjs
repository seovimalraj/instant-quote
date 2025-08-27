/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';

const files = globSync('src/app/api/**/route.{ts,tsx}', { nodir: true, windowsPathsNoEscape: true });

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const hasRuntime = /(^|\n)\s*export\s+const\s+runtime\s*=\s*['"](edge|nodejs)['"]/m.test(s);
  if (!hasRuntime) {
    s = "export const runtime = 'nodejs'\n" + s;
    fs.writeFileSync(f, s);
    console.log('patched runtime=nodejs ->', f);
  }
}
