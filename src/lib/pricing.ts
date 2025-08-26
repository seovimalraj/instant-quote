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
  rate_per_min: number;
  setup_fee?: number;
  margin_pct?: number;
  capacity_minutes_per_day?: number;
  queue_minutes?: number;
  expedite_multiplier?: number;
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

interface BaseCostResult {
  subtotal: number;
  lineItems: LineItem[];
  breakdown: Record<string, number>;
  time_minutes: number;
}

function computeBaseCost(input: PricingInput): BaseCostResult {
  const { process, quantity, material, finish, tolerance, geometry, rate_card } = input;
  const lineItems: LineItem[] = [];
  const breakdown: Record<string, number> = {};

  const density = material.density_kg_m3 ?? 0;
  const machinability = material.machinability_factor ?? 1;

  const mass_kg = (geometry.volume_mm3 / 1e9) * density;
  const materialCostPerPart = mass_kg * material.cost_per_kg;
  const materialCost = materialCostPerPart * quantity;
  lineItems.push({ description: "material", amount: materialCost });
  breakdown.material = materialCost;

  let processCost = 0;
  let time_min_per_part = 0;
  switch (process) {
    case "cnc_milling": {
      const removalRate = 600; // mm^3 per minute heuristic
      time_min_per_part = (geometry.volume_mm3 / removalRate) * machinability;
      const machiningRate = rate_card.three_axis_rate_per_min ?? 0;
      processCost = time_min_per_part * machiningRate * quantity;
      lineItems.push({ description: "machining", amount: processCost });
      breakdown.machining = processCost;
      break;
    }
    case "cnc_turning": {
      const removalRate = 800;
      time_min_per_part = (geometry.volume_mm3 / removalRate) * machinability;
      const turningRate = rate_card.turning_rate_per_min ?? 0;
      processCost = time_min_per_part * turningRate * quantity;
      lineItems.push({ description: "turning", amount: processCost });
      breakdown.turning = processCost;
      break;
    }
    case "sheet_metal": {
      const area_m2 = geometry.surface_area_mm2 / 1e6;
      const thickness = geometry.thickness_mm ?? 1;
      const densityFactor = density / 1e3; // kg per m2 per mm thickness
      const materialCostSheet =
        area_m2 * thickness * densityFactor * material.cost_per_kg * quantity;
      const laserRate = rate_card.laser_rate_per_min ?? 0;
      time_min_per_part = area_m2 * 2; // heuristic constant
      const laserCost = time_min_per_part * laserRate * quantity;
      const bendCost = (geometry.bends_count ?? 0) * (rate_card.bend_rate_per_bend ?? 0) * quantity;
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
      time_min_per_part = 0; // build time not modeled
      processCost = volume_cm3 * (rate ?? 0) * supportFactor * quantity;
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
      (geometry.surface_area_mm2 / 1e6) * (finish.cost_per_m2 ?? 0) * quantity +
      (finish.setup_fee ?? 0);
    lineItems.push({ description: "finish", amount: finishCost });
    breakdown.finish = finishCost;
  }

  let subtotal = materialCost + processCost + finishCost;
  const time_minutes = time_min_per_part * quantity;

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

  return { subtotal, lineItems, breakdown, time_minutes };
}

function applyLeadTime(
  machine: Machine,
  baseSubtotal: number,
  requested: "standard" | "expedite",
  requiredMinutes: number,
  lineItems: LineItem[],
  breakdown: Record<string, number>
) {
  const perDay = machine.capacity_minutes_per_day ?? 480;
  const queue = machine.queue_minutes ?? 0;

  if (requested === "expedite") {
    const windowDays = 3;
    const available = perDay * windowDays - queue;
    if (requiredMinutes <= available) {
      const multiplier = machine.expedite_multiplier ?? 1.5;
      const fee = baseSubtotal * (multiplier - 1);
      lineItems.push({ description: "expedite", amount: fee });
      breakdown.expedite = fee;
      return {
        subtotal: baseSubtotal * multiplier,
        lead_time_days: windowDays,
        promise_date: addDays(new Date(), windowDays).toISOString(),
        capacity_minutes_reserved: requiredMinutes,
      };
    }
  }

  // Standard slot
  const daysUntilStart = Math.ceil(queue / perDay);
  const lead = daysUntilStart + 7;
  return {
    subtotal: baseSubtotal,
    lead_time_days: lead,
    promise_date: addDays(new Date(), lead).toISOString(),
    capacity_minutes_reserved: requiredMinutes,
  };
}

export function priceItem(
  input: PricingInput & {
    machines: Machine[];
    carbon_offset?: boolean;
    user?: { team_defaults?: Record<string, any> };
  }
): PricingResult {
  const merged = input.user
    ? applyTeamDefaults<PricingInput>(input.user, input)
    : input;
  const base = computeBaseCost(merged);
  const rate_card = merged.rate_card;
  const carbon_rate = rate_card.carbon_offset_rate_per_order ?? 0;

  let best: PricingResult | null = null;

  for (const m of input.machines) {
    const lineItems = base.lineItems.map((li) => ({ ...li }));
    const breakdown = { ...base.breakdown };
    const lead = applyLeadTime(
      m,
      base.subtotal,
      merged.lead_time,
      base.time_minutes,
      lineItems,
      breakdown
    );

    let subtotal = lead.subtotal;
    if (input.carbon_offset && carbon_rate > 0) {
      lineItems.push({ description: "carbon_offset", amount: carbon_rate });
      breakdown.carbon_offset = carbon_rate;
      subtotal += carbon_rate;
    }

    if (m.setup_fee) {
      lineItems.push({ description: "setup_fee", amount: m.setup_fee });
      breakdown.setup_fee = (breakdown.setup_fee ?? 0) + m.setup_fee;
      subtotal += m.setup_fee;
    }

    if (m.margin_pct) {
      const margin = subtotal * m.margin_pct;
      lineItems.push({ description: "margin", amount: margin });
      breakdown.margin = margin;
      subtotal += margin;
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

    const result: PricingResult = {
      subtotal,
      tax,
      shipping,
      total,
      lead_time_days: lead.lead_time_days,
      lineItems,
      breakdownJson: breakdown,
      machine_id: m.id,
      promise_date: lead.promise_date,
      capacity_minutes_reserved: lead.capacity_minutes_reserved,
    };

    if (!best || result.total < best.total) {
      best = result;
    }
  }

  return best!;
}

export function priceTiers(
  input: Omit<PricingInput, "quantity"> & {
    quantities: number[];
    machines: Machine[];
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

// Backwards-compatible export
export function calculatePricing(input: PricingInput): PricingResult {
  const rate_card = input.rate_card;
  const rateKeyMap: Record<string, string> = {
    cnc_milling: "three_axis_rate_per_min",
    cnc_turning: "turning_rate_per_min",
    sheet_metal: "laser_rate_per_min",
  };
  const rateKey = rateKeyMap[input.process as keyof typeof rateKeyMap];
  const rate = rateKey ? (rate_card[rateKey as keyof typeof rate_card] as number) : 0;
  const machine: Machine = {
    id: "default",
    name: "default",
    rate_per_min: rate,
    setup_fee: rate_card.machine_setup_fee ?? 0,
  };
  return priceItem({ ...input, machines: [machine] });
}
