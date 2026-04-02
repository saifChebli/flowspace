import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().min(2).max(100),
});

export const createListSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.number().int().min(0),
});

export const updateListSchema = createListSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  position: z.number().int().min(0),
  dueDate: z.string().datetime().optional(),
  labels: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ position: true });

export const moveTaskSchema = z.object({
  listId: z.string(),
  position: z.number().int().min(0),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
