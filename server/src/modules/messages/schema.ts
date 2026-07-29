import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  mentionedUserIds: z.array(z.string()).optional(),
  fileIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
});

export const editMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  // Bounded and NaN-safe: `?limit=abc` used to reach Prisma as `take: NaN` (500),
  // and a huge value fetched the whole channel with its include fan-out.
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
