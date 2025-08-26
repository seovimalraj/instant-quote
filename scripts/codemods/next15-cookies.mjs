import fs from 'node:fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{ts,tsx}', { nodir: true });
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (!/from ["']next\/headers["']/.test(s)) continue;
  if (!s.includes('cookies()')) continue;
  if (!s.includes("from '@/lib/next/cookies")) {
    s = s.replace(/from ["']next\/headers["'];?/g, (m) => `${m}\nimport { cookiesAsync } from '@/lib/next/cookies';`);
  }
  // Add await cookiesAsync() in common patterns
  s = s.replace(/const\s+([a-zA-Z_][\w]*)\s*=\s*cookies\(\)/g, 'const $1 = await cookiesAsync()');
  // If top-level await might be illegal in this file, developer will move into async fn. We keep it simple.
  fs.writeFileSync(f, s);
  console.log('patched', f);
}
