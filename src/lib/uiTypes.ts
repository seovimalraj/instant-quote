export type LeadTime = 'standard' | 'expedite';

export function normalizeLeadTime(v: string): LeadTime {
  return v === 'expedite' ? 'expedite' : 'standard';
}
