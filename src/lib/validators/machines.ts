import { z } from "zod";

const baseMachine = z.object({
  id: z.string(),
  name: z.string(),
  envelope_mm: z
    .tuple([
      z.number().positive(),
      z.number().positive(),
      z.number().positive(),
    ])
    .optional(),
});

const cncParams = z.object({
  k_area: z.number().nonnegative(),
  k_volume: z.number().nonnegative(),
  axis_factor_5: z.number().positive(),
  tool_change_min: z.number().nonnegative(),
});

const injectionParams = z.object({
  press_tonnage_min: z.number().positive(),
  press_tonnage_max: z.number().positive(),
  press_rate_per_hour: z.number().nonnegative(),
  cycle_base_sec: z.number().nonnegative(),
  cycle_per_cm3_sec: z.number().nonnegative(),
  runner_waste_pct: z.number().nonnegative(),
  tooling_base: z.number().nonnegative(),
  tooling_per_cm3: z.number().nonnegative(),
  tool_life_shots: z.number().positive(),
  changeover_min: z.number().nonnegative(),
});

const castingParams = z.object({
  supported_types: z.array(z.string()),
  melt_rate_kg_per_hr: z.number().nonnegative(),
  pour_yield_pct: z.number().nonnegative(),
  scrap_pct: z.number().nonnegative(),
  mold_cost_per_unit: z.number().nonnegative(),
  mold_setup_cost: z.number().nonnegative(),
  finishing_rate_per_min: z.number().nonnegative(),
  heat_treat_cost_per_kg: z.number().nonnegative(),
});

const cncMachine = baseMachine.extend({
  process_kind: z.literal("cnc"),
  params: cncParams,
});

const injectionMachine = baseMachine.extend({
  process_kind: z.literal("injection"),
  params: injectionParams,
});

const castingMachine = baseMachine.extend({
  process_kind: z.literal("casting"),
  params: castingParams,
});

export const machineSchema = z.union([
  cncMachine,
  injectionMachine,
  castingMachine,
]);

export type Machine = z.infer<typeof machineSchema>;

