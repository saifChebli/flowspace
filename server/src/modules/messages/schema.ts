import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  mentionedUserIds: z.array(z.string()).optional(),
  fileIds: z.array(z.string()).optional(),
});

export const editMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().default('50').transform(Number),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
