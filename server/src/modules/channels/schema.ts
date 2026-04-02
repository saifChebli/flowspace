import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase alphanumeric with hyphens'),
  type: z.enum(['PUBLIC', 'PRIVATE', 'CLIENT_VISIBLE']).default('PUBLIC'),
  description: z.string().max(300).optional(),
});

export const updateChannelSchema = createChannelSchema
  .omit({ name: true })
  .extend({ description: z.string().max(300).optional() });

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
