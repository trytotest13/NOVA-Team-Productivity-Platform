import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color');

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  color: hexColor.default('#4F46E5'),
  dueDate: z.coerce.date().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  color: hexColor.optional(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addMemberSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
