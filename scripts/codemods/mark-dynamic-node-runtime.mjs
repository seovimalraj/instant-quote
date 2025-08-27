/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';

const files = globSync('src/app/**/page.{ts,tsx}', {
  nodir: true,
  windowsPathsNoEscape: true,
});

const needsRuntime = (s) => /from ['"]@supabase\/ssr['"]/.test(s) || /from ['"]@\/lib\/supabase\/server['"]/.test(s);

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (!needsRuntime(s)) continue;

  const hasDynamic = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];?/.test(s);
  const hasRuntime = /export\s+const\s+runtime\s*=\s*['"]nodejs['"];?/.test(s);

  let header = '';
  if (!hasDynamic) header += "export const dynamic = 'force-dynamic'\n";
  if (!hasRuntime) header += "export const runtime = 'nodejs'\n";

  if (header) {
    s = header + '\n' + s;
    fs.writeFileSync(f, s);
    console.log('patched dynamic+runtime ->', f);
  }
}
