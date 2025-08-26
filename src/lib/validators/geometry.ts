import { z } from "zod";

export const geometrySchema = z.object({
  volume_mm3: z.number().nonnegative(),
  surface_area_mm2: z.number().nonnegative(),
  bbox: z.tuple([z.number(), z.number(), z.number()]),
  projected_area_mm2: z.number().nonnegative().optional(),
  meta: z.record(z.any()).optional(),
});

export type Geometry = z.infer<typeof geometrySchema>;
