import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  position: z.number().int().min(0),
  dueDate: z.string().datetime().optional(),
  labels: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ position: true });

export const moveTaskSchema = z.object({
  listId: z.string(),
  position: z.number().int().min(0),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const timeEntrySchema = z.object({
  minutes: z.number().int().min(1).max(1440),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
