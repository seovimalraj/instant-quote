import { z } from "zod";

export const geometrySchema = z.object({
  volume_mm3: z.number().nonnegative(),
  surface_area_mm2: z.number().nonnegative(),
  bbox: z.tuple([
    z.number().nonnegative(),
    z.number().nonnegative(),
    z.number().nonnegative(),
  ]),
  thickness_mm: z.number().positive().optional(),
  holes_count: z.number().int().nonnegative().optional(),
  bends_count: z.number().int().nonnegative().optional(),
  max_overhang_deg: z.number().nonnegative().optional(),
  hole_depth_diameter_ratio: z.number().nonnegative().optional(),
  bend_radius_mm: z.number().nonnegative().optional(),
  min_feature_mm: z.number().nonnegative().optional(),
  tap_drill_mismatch: z.boolean().optional(),
});

export const pricingInputSchema = z.object({
  process: z.enum([
    "cnc_milling",
    "cnc_turning",
    "sheet_metal",
    "3dp_fdm",
    "3dp_sla",
    "3dp_sls",
    "injection_proto",
  ]),
  quantity: z.number().int().positive(),
  material: z.object({
    density_kg_m3: z.number().positive().optional(),
    cost_per_kg: z.number().positive(),
    machinability_factor: z.number().positive().optional(),
  }),
  finish: z
    .object({
      cost_per_m2: z.number().nonnegative().optional(),
      setup_fee: z.number().nonnegative().optional(),
    })
    .optional(),
  tolerance: z
    .object({
      cost_multiplier: z.number().positive().optional(),
    })
    .optional(),
  geometry: geometrySchema,
  lead_time: z.enum(["standard", "expedite"]).default("standard"),
  rate_card: z.object({
    three_axis_rate_per_min: z.number().nonnegative().optional(),
    five_axis_rate_per_min: z.number().nonnegative().optional(),
    turning_rate_per_min: z.number().nonnegative().optional(),
    sheet_setup_fee: z.number().nonnegative().optional(),
    bend_rate_per_bend: z.number().nonnegative().optional(),
    laser_rate_per_min: z.number().nonnegative().optional(),
    fdm_rate_per_cm3: z.number().nonnegative().optional(),
    sla_rate_per_cm3: z.number().nonnegative().optional(),
    sls_rate_per_cm3: z.number().nonnegative().optional(),
    injection_mold_setup: z.number().nonnegative().optional(),
    injection_part_rate: z.number().nonnegative().optional(),
    tax_rate: z.number().nonnegative().optional(),
    shipping_flat: z.number().nonnegative().optional(),
  }),
});

export type Geometry = z.infer<typeof geometrySchema>;
export type PricingInput = z.infer<typeof pricingInputSchema>;
