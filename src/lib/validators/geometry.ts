import { z } from 'zod';

export const stlGeometrySchema = z
  .object({
    partId: z.string().uuid(),
    fileUrl: z.string().optional(),
    uploadId: z.string().optional(),
    unitsHint: z.enum(['mm', 'inch', 'm']).optional(),
  })
  .refine((d) => d.fileUrl || d.uploadId, {
    message: 'fileUrl or uploadId required',
    path: ['fileUrl'],
  });

export type StlGeometryInput = z.infer<typeof stlGeometrySchema>;
