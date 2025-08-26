import { checkFeasibility } from '../../src/lib/feasibility';
import type { PricingInput } from '../../src/lib/validators/pricing';
import type { Machine } from '../../src/lib/validators/machines';

describe('feasibility checks', () => {
  const baseItem: PricingInput = {
    process_kind: 'injection',
    quantity: 10,
    geometry: { volume_mm3: 1, surface_area_mm2: 1, bbox: [100, 100, 10] as [number, number, number] },
  } as any;

  const machine: Machine = {
    id: 'm1',
    name: 'MoldPress',
    process_kind: 'injection',
    params: {
      press_tonnage_min: 2,
      press_tonnage_max: 5,
      press_rate_per_hour: 0,
      cycle_base_sec: 0,
      cycle_per_cm3_sec: 0,
      runner_waste_pct: 0,
      tooling_base: 0,
      tooling_per_cm3: 0,
      tool_life_shots: 50,
      changeover_min: 0,
    },
  };

  it('warns when tonnage below minimum', () => {
    const res = checkFeasibility(baseItem, machine, baseItem.geometry);
    expect(res.ok).toBe(true);
    expect(res.warnings.some(w => w.message.includes('below machine minimum'))).toBe(true);
  });

  it('errors when tonnage exceeds machine capacity', () => {
    const big = {
      ...baseItem,
      geometry: {
        ...baseItem.geometry,
        bbox: [500, 500, 10] as [number, number, number],
      },
    };
    const res = checkFeasibility(big, machine, big.geometry);
    expect(res.ok).toBe(false);
    const err = res.warnings.find(w => w.severity === 'error');
    expect(err?.message).toMatch(/exceeds machine capacity/);
  });

  it('warns when quantity exceeds tool life', () => {
    const midMachine: Machine = { ...machine, params: { ...machine.params, press_tonnage_min: 1, press_tonnage_max: 10 } };
    const qtyItem: PricingInput = {
      ...baseItem,
      quantity: 100,
      geometry: {
        volume_mm3: 1,
        surface_area_mm2: 1,
        bbox: [100, 200, 10] as [number, number, number],
      },
    } as any;
    const res = checkFeasibility(qtyItem, midMachine, qtyItem.geometry);
    expect(res.ok).toBe(true);
    expect(res.warnings.some(w => w.message.includes('exceeds tool life'))).toBe(true);
  });
});
