import { describe, it, expect } from 'vitest';
import { generateQAP } from '../../src/lib/qap';

describe('QAP generation', () => {
  it('creates an HTML file', async () => {
    const res = await generateQAP({ partName: 'widget', ctq: ['size'], aql: '1.0' });
    expect(res.file).toBeTruthy();
  });
});
