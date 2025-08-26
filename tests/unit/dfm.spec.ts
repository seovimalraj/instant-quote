import { describe, it, expect } from 'vitest';
import { analyzeGeometry } from '../../src/lib/dfm/analyze';

describe('DFM analysis', () => {
  it('returns overlays for thin walls', () => {
    const res = analyzeGeometry({ volume_mm3: 10, surface_area_mm2: 2, bbox: { x: 1, y: 1, z: 1 } });
    expect(res.length).toBeGreaterThan(0);
  });
});
