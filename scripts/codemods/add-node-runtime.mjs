/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';

// Find every API route and ensure it declares Node.js runtime (avoids Edge + Supabase warnings)
const files = globSync('src/app/api/**/route.{ts,tsx}', {
  nodir: true,
  windowsPathsNoEscape: true,
});

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');

  // Plain, readable regex — no unnecessary escapes
  const hasRuntime = /(^|\n)\s*export\s+const\s+runtime\s*=\s*['"](edge|nodejs)['"]/.test(s);

  if (!hasRuntime) {
    s = `export const runtime = 'nodejs'\n` + s;
    fs.writeFileSync(f, s);
    // eslint-disable-next-line no-console
    console.log('patched runtime=nodejs ->', f);
  }
}
