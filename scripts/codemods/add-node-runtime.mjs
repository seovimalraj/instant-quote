import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const files = globSync('src/app/api/**/route.{ts,tsx}', { nodir: true, windowsPathsNoEscape: true });
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (/export\s+const\s+runtime\s*=\s*['\"](edge|nodejs)['\"]/m.test(s)) {
    // already declares runtime
  } else {
    s = `export const runtime = 'nodejs'\n` + s;
    fs.writeFileSync(f, s);
    console.log('patched runtime=nodejs ->', f);
  }
}
