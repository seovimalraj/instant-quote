import type { PricingInput } from "./validators/pricing";
import { addDays } from "date-fns";
import { applyTeamDefaults } from "./dfm";

export interface LineItem {
  description: string;
  amount: number;
}

export interface Machine {
  id: string;
  name: string;
  process_code: string;
  axis_count: number;
  envelope_mm?: [number, number, number];
  rate_per_min: number;
  setup_fee?: number;
  overhead_multiplier?: number;
  expedite_multiplier?: number;
  utilization_target?: number;
  margin_pct?: number;
  is_active?: boolean;
}

export interface MachineMaterialLink {
  machine_id: string;
  material_id: string;
  material_rate_multiplier?: number;
}

export interface MachineFinishLink {
  machine_id: string;
  finish_id: string;
  finish_rate_multiplier?: number;
}

export interface PricingResult {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  lead_time_days: number;
  lineItems: LineItem[];
  breakdownJson: Record<string, number>;
  machine_id?: string;
  promise_date: string;
  capacity_minutes_reserved: number;
}

function defaultMachineFromRateCard(input: PricingInput): Machine {
  return {
    id: "rate_card",
    name: "rate_card",
    process_code: input.process,
    axis_count: 3,
    rate_per_min: input.rate_card.three_axis_rate_per_min ?? 0,
    setup_fee: 0,
    overhead_multiplier: 1,
    expedite_multiplier: 1,
    utilization_target: 1,
    margin_pct: 0,
    is_active: true,
  };
}

function priceWithMachine(
  machine: Machine,
  input: PricingInput,
  materialMultiplier: number,
  finishMultiplier: number,
  carbonOffset?: boolean
): PricingResult {
  const { geometry, material, finish, tolerance, quantity, rate_card, lead_time } = input;
  const lineItems: LineItem[] = [];
  const breakdown: Record<string, number> = {};

  const density = material.density_kg_m3 ?? 0;
  const machinability = material.machinability_factor ?? 1;

  const mass_kg = (geometry.volume_mm3 / 1e9) * density;
  const materialCostPerPart = mass_kg * material.cost_per_kg;
  const materialCost = materialCostPerPart * quantity;
  lineItems.push({ description: "material", amount: materialCost });
  breakdown.material = materialCost;

  const k1 = 6;
  const k2 = 8;
  let time_min =
    k1 * (geometry.surface_area_mm2 / 1e6) +
    k2 * ((geometry.volume_mm3 * 0.35) / 1e9);
  const axis_factor = machine.axis_count === 5 ? 0.85 : 1.0;
  time_min *= axis_factor * machinability;
  const utilization = machine.utilization_target ?? 1;
  const machiningCost =
    time_min * machine.rate_per_min * quantity * materialMultiplier / utilization;
  lineItems.push({ description: "machining", amount: machiningCost });
  breakdown.machining = machiningCost;

  let subtotal = materialCost + machiningCost;
  const time_minutes = time_min * quantity;

  if (machine.setup_fee) {
    lineItems.push({ description: "setup_fee", amount: machine.setup_fee });
    breakdown.setup_fee = machine.setup_fee;
    subtotal += machine.setup_fee;
  }

  if (finish) {
    const area_m2 = (geometry.surface_area_mm2 / 1e6) * quantity;
    const areaCost = area_m2 * (finish.cost_per_m2 ?? 0);
    const setup = (finish.setup_fee ?? 0) * finishMultiplier;
    const finishCost = areaCost + setup;
    lineItems.push({ description: "finish", amount: finishCost });
    breakdown.finish = finishCost;
    subtotal += finishCost;
  }

  const tolMultiplier = tolerance?.cost_multiplier ?? 1;
  if (tolMultiplier !== 1) {
    const tolAmount = subtotal * (tolMultiplier - 1);
    subtotal *= tolMultiplier;
    lineItems.push({ description: "tolerance", amount: tolAmount });
    breakdown.tolerance = tolAmount;
  }

  const overhead = machine.overhead_multiplier ?? 1;
  if (overhead !== 1) {
    const overAmt = subtotal * (overhead - 1);
    subtotal *= overhead;
    lineItems.push({ description: "overhead", amount: overAmt });
    breakdown.overhead = overAmt;
  }

  if (lead_time === "expedite") {
    const exp = machine.expedite_multiplier ?? 1;
    if (exp !== 1) {
      const expAmt = subtotal * (exp - 1);
      subtotal *= exp;
      lineItems.push({ description: "expedite", amount: expAmt });
      breakdown.expedite = expAmt;
    }
  }

  const discount = Math.min(0.2, 1 - 1 / Math.sqrt(quantity));
  if (discount > 0) {
    const discAmt = subtotal * discount;
    subtotal *= 1 - discount;
    lineItems.push({ description: "quantity_discount", amount: -discAmt });
    breakdown.quantity_discount = -discAmt;
  }

  const carbon_rate = rate_card.carbon_offset_rate_per_order ?? 0;
  if (carbonOffset && carbon_rate > 0) {
    lineItems.push({ description: "carbon_offset", amount: carbon_rate });
    breakdown.carbon_offset = carbon_rate;
    subtotal += carbon_rate;
  }

  const tax = subtotal * (rate_card.tax_rate ?? 0);
  const shipping = rate_card.shipping_flat ?? 0;
  let total = subtotal + tax + shipping;
  if (tax) {
    lineItems.push({ description: "tax", amount: tax });
    breakdown.tax = tax;
  }
  if (shipping) {
    lineItems.push({ description: "shipping", amount: shipping });
    breakdown.shipping = shipping;
  }

  const margin = machine.margin_pct ?? 0;
  if (margin) {
    const marginAmt = total * margin;
    total += marginAmt;
    lineItems.push({ description: "margin", amount: marginAmt });
    breakdown.margin = marginAmt;
  }

  const lead_time_days = lead_time === "expedite" ? 3 : 7;
  const promise_date = addDays(new Date(), lead_time_days).toISOString();

  return {
    subtotal,
    tax,
    shipping,
    total,
    lead_time_days,
    lineItems,
    breakdownJson: breakdown,
    machine_id: machine.id,
    promise_date,
    capacity_minutes_reserved: time_minutes,
  };
}

export function priceItem(
  input: PricingInput & {
    machines: Machine[];
    machineMaterials?: MachineMaterialLink[];
    machineFinishes?: MachineFinishLink[];
    carbon_offset?: boolean;
    user?: { team_defaults?: Record<string, any> };
  }
): PricingResult {
  const merged = input.user
    ? applyTeamDefaults<PricingInput>(input.user, input)
    : input;

  const materialId = (merged.material as any).id;
  const finishId = (merged.finish as any)?.id;

  const candidates: { machine: Machine; matMul: number; finMul: number }[] = [];

  for (const m of input.machines) {
    if (m.process_code !== merged.process) continue;
    if (m.is_active === false) continue;
    if (m.envelope_mm) {
      const [bx, by, bz] = merged.geometry.bbox;
      const [ex, ey, ez] = m.envelope_mm;
      if (bx > ex || by > ey || bz > ez) continue;
    }
    const matLinks = input.machineMaterials?.filter((l) => l.machine_id === m.id) ?? [];
    let matMul = 1;
    if (matLinks.length > 0) {
      const link = matLinks.find((l) => l.material_id === materialId);
      if (!link) continue;
      matMul = link.material_rate_multiplier ?? 1;
    }
    const finLinks = input.machineFinishes?.filter((l) => l.machine_id === m.id) ?? [];
    let finMul = 1;
    if (finLinks.length > 0 && finishId) {
      const link = finLinks.find((l) => l.finish_id === finishId);
      if (!link) continue;
      finMul = link.finish_rate_multiplier ?? 1;
    } else if (finLinks.length > 0 && !finishId) {
      // finish not requested but links exist -> allow
    }
    candidates.push({ machine: m, matMul, finMul });
  }

  if (candidates.length === 0) {
    const fallback = defaultMachineFromRateCard(merged);
    candidates.push({ machine: fallback, matMul: 1, finMul: 1 });
  }

  let best: PricingResult | null = null;
  for (const c of candidates) {
    const res = priceWithMachine(
      c.machine,
      merged,
      c.matMul,
      c.finMul,
      input.carbon_offset
    );
    if (!best || res.total < best.total) {
      best = res;
    }
  }

  return best!;
}

export function priceTiers(
  input: Omit<PricingInput, "quantity"> & {
    quantities: number[];
    machines: Machine[];
    machineMaterials?: MachineMaterialLink[];
    machineFinishes?: MachineFinishLink[];
    carbon_offset?: boolean;
    user?: { team_defaults?: Record<string, any> };
  }
): Record<number, PricingResult> {
  const results: Record<number, PricingResult> = {};
  const sorted = [...input.quantities].sort((a, b) => a - b);
  let prevUnit: number | null = null;
  for (const q of sorted) {
    const res = priceItem({ ...input, quantity: q });
    let unit = res.total / q;
    if (prevUnit !== null) {
      if (unit > prevUnit) {
        const newTotal = prevUnit * q;
        const diff = newTotal - res.total;
        res.lineItems.push({ description: "tier_adjustment", amount: diff });
        res.breakdownJson.tier_adjustment = diff;
        res.subtotal += diff;
        res.total = newTotal;
        unit = prevUnit;
      } else if (unit < prevUnit * 0.8) {
        const capped = prevUnit * 0.8;
        const newTotal = capped * q;
        const diff = newTotal - res.total;
        res.lineItems.push({ description: "tier_adjustment", amount: diff });
        res.breakdownJson.tier_adjustment = diff;
        res.subtotal += diff;
        res.total = newTotal;
        unit = capped;
      }
    }
    prevUnit = unit;
    results[q] = res;
  }
  return results;
}

export function calculatePricing(input: PricingInput): PricingResult {
  return priceItem({
    ...input,
    machines: [],
    machineMaterials: [],
    machineFinishes: [],
  });
}

