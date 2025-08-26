import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export const qapInputSchema = z.object({
  partName: z.string(),
  ctq: z.array(z.string()).default([]),
  aql: z.string().default('general'),
});

export type QAPInput = z.infer<typeof qapInputSchema>;

export async function generateQAP(input: QAPInput) {
  const id = randomUUID();
  const html = `<!doctype html><html><body><h1>QAP for ${input.partName}</h1><p>AQL: ${input.aql}</p><ul>${input.ctq
    .map((c) => `<li>${c}</li>`)
    .join('')}</ul></body></html>`;
  const file = `qap-${id}.html`;
  await fs.writeFile(file, html);
  return { id, file };
}
