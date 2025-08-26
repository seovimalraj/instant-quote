import { applyTeamDefaults } from "./dfm";
import { normalizeProcessKind } from "./process";

export interface PricingGeometry {
  volume_mm3: number;
  surface_area_mm2: number;
  bbox: [number, number, number];
  thickness_mm?: number;
  holes_count?: number;
  bends_count?: number;
  max_overhang_deg?: number;
  tap_drill_mismatch?: boolean;
}

export interface PricingInput {
  process_kind: "cnc" | "injection" | "casting";
  quantity: number;
  lead_time: "standard" | "expedite";
  geometry: PricingGeometry;
  material?: any;
  finish?: any;
  tolerance?: any;
  rate_card: any;
}

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
  /** CNC specific */
  tool_change_min?: number;
  axis_factor_5?: number;
  /** Injection specific */
  runner_pct?: number;
  cycle_time_base_sec?: number;
  cycle_time_per_cm3_sec?: number;
  press_rate_per_hour?: number;
  tooling_base_cost?: number;
  tooling_per_cm3_cost?: number;
  tool_life_shots?: number;
  changeover_min?: number;
  shot_capacity_cm3?: number;
  clamp_tonnage_t?: number;
  /** Casting specific */
  yield_pct?: number;
  scrap_pct?: number;
  melt_rate_kg_per_hr?: number;
  mold_cost_per_unit?: number;
  mold_setup_cost?: number;
  max_gross_kg?: number;
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
  q: number;
  unit_price: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency?: string;
  machine_id?: string;
  promise_date?: string;
  lead_time_days?: number;
  breakdownJson: any;
  warnings?: any[];
  unit?: number;
  lineItems: LineItem[];
  breakdown: Record<string, number>;
}

function defaultMachineFromRateCard(input: PricingInput): Machine {
  return {
    id: "rate_card",
    name: "rate_card",
    process_code: input.process_kind,
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

async function priceWithMachine(
  machine: Machine,
  input: PricingInput,
  materialMultiplier: number,
  finishMultiplier: number
): Promise<PricingResult> {
  const { geometry, material, finish, tolerance, quantity: q, rate_card, lead_time } = input;
  const lineItems: LineItem[] = [];
  const breakdown: Record<string, number> = {};

  const density = material.density_kg_m3 ?? 0;
  let subtotal = 0;

  switch (machine.process_code) {
    case "cnc":
    case "cnc_milling":
    case "cnc_turning": {
      const k_area = 6;
      const k_volume = 8;
      let time_min =
        k_area * (geometry.surface_area_mm2 / 1e6) +
        k_volume * ((geometry.volume_mm3 * 0.35) / 1e9);
      if (machine.axis_count === 5) {
        time_min *= machine.axis_factor_5 ?? 0.85;
      }
      time_min *= material.machinability_factor ?? 1;
      time_min += (machine.tool_change_min ?? 0) / q;
      const utilization = machine.utilization_target ?? 1;
      const machining = (time_min * q * machine.rate_per_min * materialMultiplier) / utilization;
      breakdown.machining = machining;
      lineItems.push({ description: "machining", amount: machining });

      const mass_kg = (geometry.volume_mm3 / 1e9) * density * q;
      const materialCost = mass_kg * material.cost_per_kg;
      breakdown.material = materialCost;
      lineItems.push({ description: "material", amount: materialCost });
      subtotal = machining + materialCost;

      if (finish) {
        const area_m2 = (geometry.surface_area_mm2 / 1e6) * q;
        const finishCost =
          area_m2 * (finish.cost_per_m2 ?? 0) +
          (finish.setup_fee ?? 0) * finishMultiplier;
        breakdown.finish = finishCost;
        lineItems.push({ description: "finish", amount: finishCost });
        subtotal += finishCost;
      }

      if (machine.setup_fee) {
        breakdown.setup_fee = machine.setup_fee;
        lineItems.push({ description: "setup_fee", amount: machine.setup_fee });
        subtotal += machine.setup_fee;
      }
      break;
    }
    case "injection":
    case "injection_proto": {
      const runner = machine.runner_pct ?? 0;
      const shot_cm3 = (geometry.volume_mm3 / 1000) * (1 + runner);
      const cycle_sec =
        (machine.cycle_time_base_sec ?? 0) +
        (machine.cycle_time_per_cm3_sec ?? 0) * shot_cm3;
      const press_cost =
        ((cycle_sec / 3600) * (machine.press_rate_per_hour ?? 0)) * q;
      breakdown.press = press_cost;
      lineItems.push({ description: "press", amount: press_cost });

      const material_kg = (geometry.volume_mm3 / 1e9) * density * q * (1 + runner);
      const materialCost = material_kg * material.cost_per_kg;
      breakdown.material = materialCost;
      lineItems.push({ description: "material", amount: materialCost });

      const tooling_base = machine.tooling_base_cost ?? 0;
      const tooling_per = machine.tooling_per_cm3_cost ?? 0;
      const tooling_total = tooling_base + tooling_per * (geometry.volume_mm3 / 1000);
      const tool_life = Math.min(q, machine.tool_life_shots ?? q);
      const tooling_cost = (tooling_total * q) / tool_life;
      if (tooling_cost) {
        breakdown.tooling = tooling_cost;
        lineItems.push({ description: "tooling", amount: tooling_cost });
      }

      const changeover = ((machine.changeover_min ?? 0) / 60) * (machine.press_rate_per_hour ?? 0);
      if (changeover) {
        breakdown.changeover = changeover;
        lineItems.push({ description: "changeover", amount: changeover });
      }

      subtotal = press_cost + materialCost + tooling_cost + changeover;
      break;
    }
    case "casting": {
      const net_kg = (geometry.volume_mm3 / 1e9) * density;
      const gross_kg =
        (net_kg / ((machine.yield_pct ?? 100) / 100)) *
        (1 + (machine.scrap_pct ?? 0) / 100);
      const materialCost = gross_kg * material.cost_per_kg * q;
      breakdown.material = materialCost;
      lineItems.push({ description: "material", amount: materialCost });
      const melt_time_min =
        ((gross_kg * q) / (machine.melt_rate_kg_per_hr ?? 1)) * 60;
      const utilization = machine.utilization_target ?? 1;
      const line_cost = (melt_time_min / utilization) * machine.rate_per_min;
      breakdown.line = line_cost;
      lineItems.push({ description: "line", amount: line_cost });
      const mold_cost =
        (machine.mold_cost_per_unit ?? 0) * q + (machine.mold_setup_cost ?? 0);
      if (mold_cost) {
        breakdown.mold = mold_cost;
        lineItems.push({ description: "mold", amount: mold_cost });
      }
      let finishCost = 0;
      if (finish) {
        const area_m2 = (geometry.surface_area_mm2 / 1e6) * q;
        finishCost =
          area_m2 * (finish.cost_per_m2 ?? 0) +
          (finish.setup_fee ?? 0) * finishMultiplier;
        breakdown.finish = finishCost;
        lineItems.push({ description: "finish", amount: finishCost });
      }
      subtotal = materialCost + line_cost + mold_cost + finishCost;
      break;
    }
    default: {
      subtotal = 0;
    }
  }

  const discount = Math.min(0.2, 1 - 1 / Math.sqrt(q));
  if (discount > 0) {
    const discAmt = subtotal * discount;
    subtotal *= 1 - discount;
    lineItems.push({ description: "quantity_discount", amount: -discAmt });
    breakdown.quantity_discount = -discAmt;
  }

  const tolMultiplier = tolerance?.cost_multiplier ?? 1;
  if (tolMultiplier !== 1) {
    const tolAmt = subtotal * (tolMultiplier - 1);
    subtotal *= tolMultiplier;
    lineItems.push({ description: "tolerance", amount: tolAmt });
    breakdown.tolerance = tolAmt;
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

  const margin = machine.margin_pct ?? 0;
  if (margin) {
    const marginAmt = subtotal * margin;
    subtotal += marginAmt;
    lineItems.push({ description: "margin", amount: marginAmt });
    breakdown.margin = marginAmt;
  }

  const tax = subtotal * (rate_card.tax_rate ?? 0);
  const shipping = rate_card.shipping_flat ?? 0;
  const total = subtotal + tax + shipping;
  if (tax) {
    lineItems.push({ description: "tax", amount: tax });
    breakdown.tax = tax;
  }
  if (shipping) {
    lineItems.push({ description: "shipping", amount: shipping });
    breakdown.shipping = shipping;
  }

  const unit_price = total / q;

  return {
    q,
    unit_price,
    subtotal,
    tax,
    shipping,
    total,
    currency: rate_card.currency,
    machine_id: machine.id,
    promise_date: undefined,
    lead_time_days: lead_time === "expedite" ? 3 : 7,
    breakdownJson: JSON.stringify(breakdown),
    warnings: [],
    unit: unit_price,
    lineItems,
    breakdown,
  };
}

export async function priceItem(
  input: PricingInput & {
    machines: Machine[];
    machineMaterials?: MachineMaterialLink[];
    machineFinishes?: MachineFinishLink[];
    user?: { team_defaults?: Record<string, any> };
  }
): Promise<PricingResult> {
  const merged = input.user
    ? applyTeamDefaults<PricingInput>(input.user, input)
    : input;

  if (!merged.material) throw new Error("material required");
  if (!merged.rate_card) throw new Error("rate_card required");

  const materialId = (merged.material as any).id;
  const finishId = (merged.finish as any)?.id;

  const candidates: { machine: Machine; matMul: number; finMul: number }[] = [];

  let fallbackUsed = false;
  for (const m of input.machines) {
    if (normalizeProcessKind(m.process_code) !== merged.process_kind) continue;
    if (m.is_active === false) continue;
    if (m.envelope_mm) {
      const [bx, by, bz] = merged.geometry.bbox;
      const [ex, ey, ez] = m.envelope_mm;
      if (bx > ex || by > ey || bz > ez) continue;
    }
    if (normalizeProcessKind(m.process_code) === "injection") {
      const runner = m.runner_pct ?? 0;
      const shot = (merged.geometry.volume_mm3 / 1000) * (1 + runner);
      if (m.shot_capacity_cm3 && shot > m.shot_capacity_cm3) continue;
    }
    if (normalizeProcessKind(m.process_code) === "casting") {
      const density = merged.material.density_kg_m3 ?? 0;
      const net = (merged.geometry.volume_mm3 / 1e9) * density;
      const gross = (net / ((m.yield_pct ?? 100) / 100)) * (1 + (m.scrap_pct ?? 0) / 100);
      if (m.max_gross_kg && gross > m.max_gross_kg) continue;
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
    fallbackUsed = true;
  }

  let best: PricingResult | null = null;
  for (const c of candidates) {
    const cand = await priceWithMachine(c.machine, merged, c.matMul, c.finMul);
    const warnings = [...(cand.warnings ?? [])];
    const result: PricingResult = { ...cand, warnings };
    if (!best || result.total < best.total) {
      best = result;
    }
  }

  if (fallbackUsed && best) {
    const warnings = [...(best.warnings ?? []), "no_matching_machine_using_rate_card"];
    best = { ...best, warnings };
  }

  return best!;
}

export async function priceTiers(
  input: Omit<PricingInput, "quantity"> & {
    quantities: number[];
    machines: Machine[];
    machineMaterials?: MachineMaterialLink[];
    machineFinishes?: MachineFinishLink[];
    user?: { team_defaults?: Record<string, any> };
  }
): Promise<Record<number, PricingResult>> {
  const results: Record<number, PricingResult> = {};
  const sorted = [...input.quantities].sort((a, b) => a - b);
  let prevUnit: number | null = null;
  for (const q of sorted) {
    const res = await priceItem({ ...input, quantity: q });
    const warnings = [...(res.warnings ?? [])];
    const result: PricingResult = { ...res, warnings };
    let unit = result.unit_price;
    if (prevUnit !== null) {
      if (unit > prevUnit) {
        const newTotal = prevUnit * q;
        const diff = newTotal - result.total;
        result.lineItems.push({ description: "tier_adjustment", amount: diff });
        result.breakdown.tier_adjustment = diff;
        result.subtotal += diff;
        result.total = newTotal;
        unit = prevUnit;
      } else if (unit < prevUnit * 0.8) {
        const capped = prevUnit * 0.8;
        const newTotal = capped * q;
        const diff = newTotal - result.total;
        result.lineItems.push({ description: "tier_adjustment", amount: diff });
        result.breakdown.tier_adjustment = diff;
        result.subtotal += diff;
        result.total = newTotal;
        unit = capped;
      }
    }
    result.unit_price = unit;
    result.unit = unit;
    prevUnit = unit;
    results[q] = result;
  }
  return results;
}

export async function calculatePricing(
  input: PricingInput
): Promise<PricingResult> {
  return priceItem({
    ...input,
    machines: [],
    machineMaterials: [],
    machineFinishes: [],
  });
}

