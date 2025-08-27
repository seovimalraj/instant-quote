/* eslint-env node */
import fs from 'node:fs';
import { globSync } from 'glob';
const files = globSync('src/app/api/**/route.{ts,tsx}', { nodir: true });
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  // Replace common legacy context annotations
  s = s.replace(/context:\s*{\s*params:\s*Record<string,\s*string>\s*}\)/g, '{ params }: { params: Record<string,string> })');
  s = s.replace(/:\s*Ctx\)/g, '(_req: Request, { params }: { params: Record<string,string> })');
  // Drop any Promise-wrapped params in route handlers
  s = s.replace(/params:\s*Promise<\s*Record<string,\s*string>\s*>/g, 'params: Record<string,string>');
  // Common zod Ctx alias removal
  s = s.replace(/type\s+Ctx\s*=\s*{\s*params:[^}]+}\s*;?/g, '');
  fs.writeFileSync(f, s);
  console.log('patched route ctx ->', f);
}
