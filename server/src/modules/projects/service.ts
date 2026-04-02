import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateProjectInput, UpdateProjectInput, InviteProjectMemberInput } from './schema';
import { sendEmail, inviteEmailTemplate } from '../../lib/email';
import { env } from '../../config/env';

export async function createProject(workspaceSlug: string, userId: string, input: CreateProjectInput) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { members: true },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertWorkspaceMember(workspace.members, userId);

  return prisma.project.create({
    data: {
      workspaceId: workspace.id,
      ...input,
      members: { create: { userId, role: 'MEMBER' } },
    },
  });
}

export async function getProjects(workspaceSlug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
  if (!workspace) throw new AppError(404, 'Workspace not found');

  return prisma.project.findMany({
    where: {
      workspaceId: workspace.id,
      members: { some: { userId } },
      archived: false,
    },
    include: { _count: { select: { members: true, channels: true, boards: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      channels: { orderBy: { createdAt: 'asc' } },
      boards: true,
    },
  });
  if (!project) throw new AppError(404, 'Project not found');
  assertProjectMember(project.members, userId);
  return project;
}

export async function updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } });
  if (!project) throw new AppError(404, 'Project not found');
  assertProjectMember(project.members, userId);

  return prisma.project.update({ where: { id: projectId }, data: input });
}

export async function archiveProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } });
  if (!project) throw new AppError(404, 'Project not found');
  assertProjectMember(project.members, userId);

  return prisma.project.update({ where: { id: projectId }, data: { archived: true } });
}

export async function inviteProjectMember(projectId: string, inviterId: string, input: InviteProjectMemberInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } });
  if (!project) throw new AppError(404, 'Project not found');

  const inviterMember = project.members.find((m) => m.userId === inviterId && m.role === 'MEMBER');
  if (!inviterMember) throw new AppError(403, 'Only project members can invite');

  const inviter = await prisma.user.findUnique({ where: { id: inviterId }, select: { name: true } });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.inviteToken.create({
    data: {
      email: input.email,
      projectId,
      role: input.role,
      createdById: inviterId,
      expiresAt,
    },
  });

  const workspace = await prisma.workspace.findUnique({ where: { id: project.workspaceId }, select: { name: true } });
  const inviteUrl = `${env.CLIENT_URL}/invites/${invite.token}`;
  await sendEmail({
    to: input.email,
    subject: `You're invited to ${project.name} on CollabSpace`,
    html: inviteEmailTemplate(inviter!.name, workspace!.name, inviteUrl),
  });

  return { message: 'Invite sent' };
}

export async function acceptProjectInvite(token: string, userId: string) {
  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date() || invite.acceptedAt) {
    throw new AppError(400, 'Invalid or expired invite');
  }
  if (!invite.projectId) throw new AppError(400, 'Invalid invite type');

  const exists = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invite.projectId, userId } },
  });
  if (exists) throw new AppError(409, 'Already a project member');

  await prisma.$transaction([
    prisma.projectMember.create({
      data: { projectId: invite.projectId, userId, role: invite.role as 'MEMBER' | 'CLIENT' },
    }),
    prisma.inviteToken.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);

  return { projectId: invite.projectId };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function assertWorkspaceMember(members: { userId: string }[], userId: string) {
  if (!members.some((m) => m.userId === userId)) throw new AppError(403, 'Not a workspace member');
}

export function assertProjectMember(members: { userId: string; role: string }[], userId: string) {
  if (!members.some((m) => m.userId === userId)) throw new AppError(403, 'Not a project member');
}
