import { calculatePricing } from '../../src/lib/pricing';

describe('pricing', () => {
  it('calculates CNC pricing with rate card fallback', async () => {
    const res = await calculatePricing({
      process_kind: 'cnc',
      quantity: 1,
      material: { density_kg_m3: 2, cost_per_kg: 20, machinability_factor: 1 },
      geometry: { volume_mm3: 1_000_000, surface_area_mm2: 6_000, bbox: [10,10,10] },
      rate_card: { three_axis_rate_per_min: 2, tax_rate: 0.1 },
    } as any);
    expect(res.total).toBeCloseTo(0.12936, 5);
    expect(res.unit_price).toBeCloseTo(0.12936, 5);
    expect(res.breakdown.machining).toBeCloseTo(0.0776, 5);
    expect(res.breakdown.material).toBeCloseTo(0.04, 5);
  });
});
