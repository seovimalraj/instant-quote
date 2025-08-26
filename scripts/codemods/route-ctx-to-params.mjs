/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';

// Rewrite "(req: Request, ctx: Ctx)" or similar to Next 15 compatible: (req: Request, context: { params: Record<string,string> })
const files = globSync('src/app/api/**/route.{ts,tsx}', { nodir: true, windowsPathsNoEscape: true });

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');

  // 1) Replace common custom type aliases for context (Ctx, Context, RouteCtx...)
  s = s.replace(/\(([^)]*?)\bctx\s*:\s*([A-Za-z_][\w]*)\b([^)]*?)\)/g, '( $1context: { params: Record<string,string> }$3 )');

  // 2) Replace any other second-arg names pointing to non-standard types
  s = s.replace(/export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(\s*([^,]+),\s*[^)]+\)\s*\{/g,
                 'export async function $1($2, context: { params: Record<string,string> }) {');

  // 3) Add minimal import for NextResponse if responses used but import missing
  if (/NextResponse\.json\(/.test(s) && !/from 'next\/server'/.test(s)) {
    s = "import { NextResponse } from 'next/server'\n" + s;
  }

  fs.writeFileSync(f, s, 'utf8');
  console.log('normalized route signature ->', f);
}
