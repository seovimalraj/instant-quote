import { evaluateDfM } from '../../src/lib/dfm';

describe('evaluateDfM', () => {
  it('flags thin walls for milling', () => {
    const hints = evaluateDfM('cnc_milling', { thickness_mm: 0.5 } as any);
    expect(hints.some(h => h.message.includes('thin'))).toBe(true);
  });

  it('flags overhangs for 3dp', () => {
    const hints = evaluateDfM('3dp_sls', { max_overhang_deg: 60 } as any);
    expect(hints.some(h => h.message.includes('Overhangs'))).toBe(true);
  });

  it('flags deep holes', () => {
    const hints = evaluateDfM('cnc_milling', { hole_depth_diameter_ratio: 8 } as any);
    expect(hints.some(h => h.message.includes('Hole depth'))).toBe(true);
  });
});
