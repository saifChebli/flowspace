import { z } from 'zod';

export const PROJECT_TEMPLATE_IDS = ['client', 'website', 'content', 'blank'] as const;

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  template: z.enum(PROJECT_TEMPLATE_IDS).default('client'),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ template: true });

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
