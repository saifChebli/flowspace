import { z } from 'zod';

export const presignUploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
