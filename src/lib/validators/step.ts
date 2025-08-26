import { z } from "zod";

export const meshSchema = z.object({
  vertices: z.array(z.tuple([z.number(), z.number(), z.number()])),
  faces: z.array(z.tuple([z.number(), z.number(), z.number()])),
});

export const stepRequestSchema = z.object({
  part_id: z.string().uuid(),
  mesh: meshSchema,
});

export type StepRequest = z.infer<typeof stepRequestSchema>;
