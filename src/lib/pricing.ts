import type { PricingInput } from "./validators/pricing";

export interface LineItem {
  description: string;
  amount: number;
}

export interface PricingResult {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  lead_time_days: number;
  lineItems: LineItem[];
  breakdownJson: Record<string, number>;
}

/**
 * Calculate pricing for a part based on process heuristics.
 *
 * ```ts
 * const result = calculatePricing({
 *   process: "cnc_milling",
 *   quantity: 10,
 *   material: { density_kg_m3: 2700, cost_per_kg: 5 },
 *   finish: { cost_per_m2: 10, setup_fee: 5 },
 *   tolerance: { cost_multiplier: 1.05 },
 *   geometry: { volume_mm3: 1_000_000, surface_area_mm2: 200_000, bbox: [100, 50, 20] },
 *   lead_time: "standard",
 *   rate_card: { three_axis_rate_per_min: 2, tax_rate: 0.07, shipping_flat: 12 },
 * });
 * console.log(result.total.toFixed(2));
 * ```
 */
export function calculatePricing(input: PricingInput): PricingResult {
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
      const rateKey = process === "3dp_fdm" ? "fdm_rate_per_cm3" : process === "3dp_sla" ? "sla_rate_per_cm3" : "sls_rate_per_cm3";
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
      (geometry.surface_area_mm2 / 1e6) * (finish.cost_per_m2 ?? 0) + (finish.setup_fee ?? 0);
    lineItems.push({ description: "finish", amount: finishCost });
    breakdown.finish = finishCost;
  }

  let subtotal = materialCost + processCost + finishCost;

  // Tolerance multiplier
  const tolMultiplier = tolerance?.cost_multiplier ?? 1;
  subtotal *= tolMultiplier;
  if (tolMultiplier !== 1) {
    const tolAdj = subtotal * (tolMultiplier - 1);
    lineItems.push({ description: "tolerance", amount: tolAdj });
    breakdown.tolerance = tolAdj;
  }

  // Quantity discount
  const discount = Math.min(0.2, 1 - 1 / Math.sqrt(quantity));
  const discountAmount = subtotal * discount;
  subtotal -= discountAmount;
  if (discountAmount > 0) {
    lineItems.push({ description: "quantity_discount", amount: -discountAmount });
    breakdown.quantity_discount = -discountAmount;
  }

  // Lead time expedite
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
  };
}
