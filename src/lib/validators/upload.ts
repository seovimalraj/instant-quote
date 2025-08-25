import { z } from "zod";

export const ALLOWED_EXTENSIONS = [".stl", ".step", ".stp", ".iges", ".igs"] as const;

export const uploadPartSchema = z.object({
  filename: z
    .string()
    .min(1)
    .refine((name) => {
      const ext = name.substring(name.lastIndexOf(".")).toLowerCase();
      return ALLOWED_EXTENSIONS.includes(ext as any);
    }, "Invalid file extension"),
});

export type UploadPartInput = z.infer<typeof uploadPartSchema>;
