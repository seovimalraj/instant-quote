import type { PricingInput } from "./validators/pricing";

export interface LineItem {
  description: string;
  amount: number;
}

export interface Machine {
  id: number;
  process_code: string;
  is_active: boolean;
  axis_count: number;
  envelope_x_mm: number;
  envelope_y_mm: number;
  envelope_z_mm: number;
  rate_per_min: number;
  setup_fee: number;
  overhead_multiplier: number;
  utilization_target: number;
  expedite_multiplier: number;
  margin_pct: number;
}

export interface MachineMaterialLink {
  machine_id: number;
  material_id: number;
}

export interface MachineFinishLink {
  machine_id: number;
  finish_id: number;
  rate_multiplier?: number;
}

export interface PricingResult {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  lead_time_days: number;
  lineItems: LineItem[];
  breakdownJson: Record<string, number>;
  machine_id?: number;
}

export type PricingInputWithMachines = PricingInput & {
  machines?: Machine[];
  machine_materials?: MachineMaterialLink[];
  machine_finishes?: MachineFinishLink[];
};

/**
 * Calculate pricing for a part. When CNC milling machines are provided, the
 * cheapest feasible machine is selected using heuristic time estimates and
 * per-machine multipliers. If no machine is suitable, fall back to the legacy
 * rate card calculation.
 */
export function calculatePricing(input: PricingInputWithMachines): PricingResult {
  const machines = input.machines ?? [];
  if (input.process === "cnc_milling" && machines.length > 0) {
    const machineResult = priceWithMachines(input);
    if (machineResult) return machineResult;
  }
  return legacyPricing(input);
}

function priceWithMachines(input: PricingInputWithMachines): PricingResult | null {
  const { process, quantity, material, finish, tolerance, geometry, lead_time, rate_card } = input;
  const machines = input.machines ?? [];
  const machineMaterials = input.machine_materials ?? [];
  const machineFinishes = input.machine_finishes ?? [];

  const density = material.density_kg_m3 ?? 0;
  const machinability = material.machinability_factor ?? 1;
  const mass_kg = (geometry.volume_mm3 / 1e9) * density;
  const materialCost = mass_kg * material.cost_per_kg;

  const [bx, by, bz] = geometry.bbox;
  const materialId = (material as any)?.id as number | undefined;
  const finishId = (finish as any)?.id as number | undefined;

  const candidates = machines.filter((m) => {
    if (!m.is_active || m.process_code !== process) return false;
    if (m.envelope_x_mm < bx || m.envelope_y_mm < by || m.envelope_z_mm < bz) return false;

    const mats = machineMaterials.filter((mm) => mm.machine_id === m.id);
    if (mats.length > 0) {
      if (!materialId || !mats.some((mm) => mm.material_id === materialId)) return false;
    }

    if (finish) {
      const fins = machineFinishes.filter((mf) => mf.machine_id === m.id);
      if (fins.length > 0 && !fins.some((mf) => mf.finish_id === finishId)) return false;
    }

    return true;
  });

  if (candidates.length === 0) return null;

  let best: { total: number; result: PricingResult } | null = null;

  for (const machine of candidates) {
    const area_m2 = geometry.surface_area_mm2 / 1e6;
    const volume_removed_m3 = (geometry.volume_mm3 * 0.35) / 1e9;
    const axis_factor = machine.axis_count === 5 ? 0.85 : 1.0;
    const base_k1 = 1;
    const base_k2 = 1;
    let time_min = base_k1 * area_m2 + base_k2 * volume_removed_m3 * axis_factor;
    time_min *= machinability;
    time_min /= machine.utilization_target || 1;
    const machiningCost = time_min * machine.rate_per_min;

    const setupCost = machine.setup_fee ?? 0;

    const finishLinks = machineFinishes.filter((mf) => mf.machine_id === machine.id);
    let finishRateMult = 1;
    if (finish && finishLinks.length > 0) {
      finishRateMult =
        finishLinks.find((mf) => mf.finish_id === finishId)?.rate_multiplier ?? 1;
    }
    const finishCost = finish
      ? area_m2 * (finish.cost_per_m2 ?? 0) + (finish.setup_fee ?? 0) * finishRateMult
      : 0;

    const lineItems: LineItem[] = [];
    const breakdown: Record<string, number> = {};

    lineItems.push({ description: "material", amount: materialCost });
    breakdown.material = materialCost;
    lineItems.push({ description: "setup", amount: setupCost });
    breakdown.setup = setupCost;
    lineItems.push({ description: "machining", amount: machiningCost });
    breakdown.machining = machiningCost;
    if (finishCost) {
      lineItems.push({ description: "finish", amount: finishCost });
      breakdown.finish = finishCost;
    }

    let subtotal = materialCost + setupCost + machiningCost + finishCost;

    const tolMultiplier = tolerance?.cost_multiplier ?? 1;
    if (tolMultiplier !== 1) {
      const tolCost = subtotal * (tolMultiplier - 1);
      subtotal += tolCost;
      lineItems.push({ description: "tolerance", amount: tolCost });
      breakdown.tolerance = tolCost;
    }

    const overheadMult = machine.overhead_multiplier ?? 1;
    if (overheadMult !== 1) {
      const overheadCost = subtotal * (overheadMult - 1);
      subtotal += overheadCost;
      lineItems.push({ description: "overhead", amount: overheadCost });
      breakdown.overhead = overheadCost;
    }

    let lead_time_days = 7;
    if (lead_time === "expedite") {
      const expediteMult = machine.expedite_multiplier ?? 1;
      if (expediteMult !== 1) {
        const expCost = subtotal * (expediteMult - 1);
        subtotal += expCost;
        lineItems.push({ description: "expedite", amount: expCost });
        breakdown.expedite = expCost;
      }
      lead_time_days = 3;
    }

    const discount = Math.min(0.2, 1 - 1 / Math.sqrt(quantity));
    if (discount > 0) {
      const discountAmount = subtotal * discount;
      subtotal -= discountAmount;
      lineItems.push({ description: "quantity_discount", amount: -discountAmount });
      breakdown.quantity_discount = -discountAmount;
    }

    const tax = subtotal * (rate_card.tax_rate ?? 0);
    if (tax) {
      lineItems.push({ description: "tax", amount: tax });
      breakdown.tax = tax;
    }

    const shipping = rate_card.shipping_flat ?? 0;
    if (shipping) {
      lineItems.push({ description: "shipping", amount: shipping });
      breakdown.shipping = shipping;
    }

    const preMarginTotal = subtotal + tax + shipping;
    const marginAmount = preMarginTotal * (machine.margin_pct ?? 0);
    if (marginAmount) {
      lineItems.push({ description: "margin", amount: marginAmount });
      breakdown.margin = marginAmount;
    }

    const total = preMarginTotal + marginAmount;

    const result: PricingResult = {
      subtotal,
      tax,
      shipping,
      total,
      lead_time_days,
      lineItems,
      breakdownJson: breakdown,
      machine_id: machine.id,
    };

    if (!best || result.total < best.total || (result.total === best.total && machine.id < (best.result.machine_id ?? 0))) {
      best = { total: result.total, result };
    }
  }

  return best ? best.result : null;
}

function legacyPricing(input: PricingInput): PricingResult {
  const { process, quantity, material, finish, tolerance, geometry, lead_time, rate_card } = input;

  const lineItems: LineItem[] = [];
  const breakdown: Record<string, number> = {};

  const density = material.density_kg_m3 ?? 0;
  const machinability = material.machinability_factor ?? 1;

  const mass_kg = (geometry.volume_mm3 / 1e9) * density;
  const materialCost = mass_kg * material.cost_per_kg;
  lineItems.push({ description: "material", amount: materialCost });
  breakdown.material = materialCost;

  let processCost = 0;
  switch (process) {
    case "cnc_milling": {
      const removalRate = 600; // mm^3 per minute heuristic
      const time_min = (geometry.volume_mm3 / removalRate) * machinability;
      const machiningRate = rate_card.three_axis_rate_per_min ?? 0;
      processCost = time_min * machiningRate;
      lineItems.push({ description: "machining", amount: processCost });
      breakdown.machining = processCost;
      break;
    }
    case "cnc_turning": {
      const removalRate = 800;
      const time_min = (geometry.volume_mm3 / removalRate) * machinability;
      const turningRate = rate_card.turning_rate_per_min ?? 0;
      processCost = time_min * turningRate;
      lineItems.push({ description: "turning", amount: processCost });
      breakdown.turning = processCost;
      break;
    }
    case "sheet_metal": {
      const area_m2 = geometry.surface_area_mm2 / 1e6;
      const thickness = geometry.thickness_mm ?? 1;
      const densityFactor = density / 1e3; // kg per m2 per mm thickness
      const materialCostSheet = area_m2 * thickness * densityFactor * material.cost_per_kg;
      const laserRate = rate_card.laser_rate_per_min ?? 0;
      const laser_time_min = area_m2 * 2; // heuristic constant
      const laserCost = laser_time_min * laserRate;
      const bendCost = (geometry.bends_count ?? 0) * (rate_card.bend_rate_per_bend ?? 0);
      processCost = materialCostSheet + laserCost + bendCost;
      lineItems.push({ description: "sheet_process", amount: processCost });
      breakdown.sheet_process = processCost;
      break;
    }
    case "3dp_fdm":
    case "3dp_sla":
    case "3dp_sls": {
      const volume_cm3 = geometry.volume_mm3 / 1000;
      const rateKey =
        process === "3dp_fdm"
          ? "fdm_rate_per_cm3"
          : process === "3dp_sla"
          ? "sla_rate_per_cm3"
          : "sls_rate_per_cm3";
      const rate = rate_card[rateKey as keyof typeof rate_card] as number | undefined;
      const supportFactor = geometry.max_overhang_deg && geometry.max_overhang_deg > 45 ? 1.1 : 1;
      processCost = volume_cm3 * (rate ?? 0) * supportFactor;
      lineItems.push({ description: "printing", amount: processCost });
      breakdown.printing = processCost;
      break;
    }
    case "injection_proto": {
      const moldSetup = rate_card.injection_mold_setup ?? 0;
      const partCost = (rate_card.injection_part_rate ?? 0) * quantity;
      processCost = moldSetup + partCost + materialCost;
      lineItems.push({ description: "mold_and_parts", amount: processCost });
      breakdown.mold_and_parts = processCost;
      break;
    }
  }

  let finishCost = 0;
  if (finish) {
    finishCost =
      (geometry.surface_area_mm2 / 1e6) * (finish.cost_per_m2 ?? 0) +
      (finish.setup_fee ?? 0);
    lineItems.push({ description: "finish", amount: finishCost });
    breakdown.finish = finishCost;
  }

  let subtotal = materialCost + processCost + finishCost;

  const tolMultiplier = tolerance?.cost_multiplier ?? 1;
  subtotal *= tolMultiplier;
  if (tolMultiplier !== 1) {
    const tolAdj = subtotal * (tolMultiplier - 1);
    lineItems.push({ description: "tolerance", amount: tolAdj });
    breakdown.tolerance = tolAdj;
  }

  const discount = Math.min(0.2, 1 - 1 / Math.sqrt(quantity));
  const discountAmount = subtotal * discount;
  subtotal -= discountAmount;
  if (discountAmount > 0) {
    lineItems.push({ description: "quantity_discount", amount: -discountAmount });
    breakdown.quantity_discount = -discountAmount;
  }

  let lead_time_days = 7;
  if (lead_time === "expedite") {
    const expediteFee = subtotal * 0.2;
    subtotal += expediteFee;
    lead_time_days = 3;
    lineItems.push({ description: "expedite", amount: expediteFee });
    breakdown.expedite = expediteFee;
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

  return {
    subtotal,
    tax,
    shipping,
    total,
    lead_time_days,
    lineItems,
    breakdownJson: breakdown,
    machine_id: undefined,
  };
}
