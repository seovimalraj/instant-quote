/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';

// Pages that should never be prerendered (they hit Supabase/auth): admin/** and (customer)/**
const pages = [
  ...globSync('src/app/admin/**/page.{ts,tsx}', { nodir: true }),
  ...globSync('src/app/(customer)/**/page.{ts,tsx}', { nodir: true })
];

for (const f of pages) {
  let s = fs.readFileSync(f, 'utf8');
  // Skip if dynamic already set
  const hasDynamic = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/m.test(s);
  const hasRevalidate = /export\s+const\s+revalidate\s*=\s*0/m.test(s);
  const hasRuntime = /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/m.test(s);

  let inject = '';
  if (!hasRuntime) inject += "export const runtime = 'nodejs'\n";
  if (!hasDynamic) inject += "export const dynamic = 'force-dynamic'\n";
  if (!hasRevalidate) inject += "export const revalidate = 0\n";

  if (inject) {
    s = inject + s;
    fs.writeFileSync(f, s);
    console.log('patched dynamic/runtime ->', f);
  }
}
