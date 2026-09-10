import { z } from 'zod';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(140, 'Title is too long'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
  assigneeId: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  status: taskStatusSchema.default('TODO'),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  status: taskStatusSchema.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const reorderTasksSchema = z.object({
  status: taskStatusSchema,
  taskIds: z.array(z.string().min(1)).min(1, 'Provide at least one task id'),
});
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;

export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().min(1).optional(),
  q: z.string().trim().max(100).optional(),
});
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
