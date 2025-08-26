/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';

// Ensure all API routes run on Node.js runtime (avoids Edge + Supabase realtime warnings)
const files = globSync('src/app/api/**/route.{ts,tsx}', {
  nodir: true,
  windowsPathsNoEscape: true,
});

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  // Detect existing runtime export without unnecessary escapes
  const hasRuntime = /export\s+const\s+runtime\s*=\s*['"](edge|nodejs)['"]/m.test(s);
  if (!hasRuntime) {
    s = "export const runtime = 'nodejs'\n" + s;
    fs.writeFileSync(f, s);
    // eslint-disable-next-line no-console
    console.log('patched runtime=nodejs ->', f);
  }
}

