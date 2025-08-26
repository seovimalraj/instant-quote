export function normalizeProcessKind(p: string): 'cnc' | 'injection' | 'casting' {
  if (p === 'cnc' || p === 'cnc_milling' || p === 'cnc_turning') return 'cnc';
  if (p.startsWith('injection')) return 'injection';
  if (p === 'casting') return 'casting';
  throw new Error(`Unknown process kind: ${p}`);
}
