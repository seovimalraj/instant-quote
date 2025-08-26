import { z } from "zod";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const triangle = z.tuple([vec3, vec3, vec3]);
const meshSchema = z.object({ tris: z.array(triangle).min(1) });

export const stepRequestSchema = z
  .object({ partId: z.string().uuid() })
  .and(
    z.union([
      z.object({ fileUrl: z.string().url() }),
      z.object({ mesh: meshSchema }),
    ]),
  );

export type StepRequest = z.infer<typeof stepRequestSchema>;
