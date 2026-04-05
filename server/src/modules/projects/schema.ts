import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const inviteProjectMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MEMBER', 'CLIENT']).default('MEMBER'),
});

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'CLIENT']),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteProjectMemberInput = z.infer<typeof inviteProjectMemberSchema>;
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;
