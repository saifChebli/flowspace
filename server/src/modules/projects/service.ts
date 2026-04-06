import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { io } from '../../server';
import type { CreateProjectInput, UpdateProjectInput, InviteProjectMemberInput, UpdateProjectMemberRoleInput } from './schema';
import { sendEmail, inviteEmailTemplate } from '../../lib/email';
import { env } from '../../config/env';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getWorkspaceBySlug(slug: string) {
  const ws = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!ws) throw new AppError(404, 'Workspace not found');
  return ws;
}

function isWorkspaceAdmin(workspaceMembers: { userId: string; role: string }[], userId: string): boolean {
  return workspaceMembers.some((m) => m.userId === userId && m.role === 'ADMIN');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createProject(workspaceSlug: string, userId: string, input: CreateProjectInput) {
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  assertWorkspaceMember(workspace.members, userId);

  // Block client-only users from creating projects
  const userProjectRoles = await prisma.projectMember.findMany({
    where: { project: { workspaceId: workspace.id }, userId },
    select: { role: true },
  });
  const isClientOnly = userProjectRoles.length > 0 && userProjectRoles.every((m) => m.role === 'CLIENT');
  if (isClientOnly && !isWorkspaceAdmin(workspace.members, userId)) {
    throw new AppError(403, 'Client users cannot create projects');
  }

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

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: workspace.id,
      members: { some: { userId } },
      archived: false,
    },
    include: {
      _count: { select: { members: true, channels: true, boards: true } },
      members: { where: { userId }, select: { role: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects.map(({ members, ...p }) => ({
    ...p,
    myRole: members[0]?.role ?? null,
  }));
}

export async function getArchivedProjects(workspaceSlug: string, userId: string) {
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  assertWorkspaceMember(workspace.members, userId);

  return prisma.project.findMany({
    where: {
      workspaceId: workspace.id,
      archived: true,
    },
    include: { _count: { select: { members: true } } },
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
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: { include: { members: true } } },
  });
  if (!project) throw new AppError(404, 'Project not found');

  // Only workspace admins can archive
  if (!isWorkspaceAdmin(project.workspace.members, userId)) {
    throw new AppError(403, 'Only workspace admins can archive projects');
  }

  return prisma.project.update({ where: { id: projectId }, data: { archived: true } });
}

export async function unarchiveProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: { include: { members: true } } },
  });
  if (!project) throw new AppError(404, 'Project not found');

  if (!isWorkspaceAdmin(project.workspace.members, userId)) {
    throw new AppError(403, 'Only workspace admins can unarchive projects');
  }

  return prisma.project.update({ where: { id: projectId }, data: { archived: false } });
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function removeProjectMember(projectId: string, actorId: string, memberId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: { include: { members: true } } },
  });
  if (!project) throw new AppError(404, 'Project not found');

  // Allow workspace admins or project MEMBERs (not CLIENTs)
  const isWsAdmin = isWorkspaceAdmin(project.workspace.members, actorId);
  const isProjectMember = project.members.some((m) => m.userId === actorId && m.role === 'MEMBER');
  if (!isWsAdmin && !isProjectMember) throw new AppError(403, 'Not authorized to remove members');

  if (actorId === memberId) throw new AppError(400, 'Cannot remove yourself');

  const target = project.members.find((m) => m.userId === memberId);
  if (!target) throw new AppError(404, 'Member not found in project');

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberId } },
  });

  return { message: 'Member removed' };
}

export async function updateProjectMemberRole(projectId: string, actorId: string, memberId: string, input: UpdateProjectMemberRoleInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: { include: { members: true } } },
  });
  if (!project) throw new AppError(404, 'Project not found');

  const isWsAdmin = isWorkspaceAdmin(project.workspace.members, actorId);
  const isProjectMember = project.members.some((m) => m.userId === actorId && m.role === 'MEMBER');
  if (!isWsAdmin && !isProjectMember) throw new AppError(403, 'Not authorized to change roles');

  const target = project.members.find((m) => m.userId === memberId);
  if (!target) throw new AppError(404, 'Member not found in project');

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId: memberId } },
    data: { role: input.role },
  });

  return { message: 'Role updated' };
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export async function inviteProjectMember(projectId: string, inviterId: string, input: InviteProjectMemberInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: { include: { members: true } } },
  });
  if (!project) throw new AppError(404, 'Project not found');

  // Allow workspace admins OR project MEMBERs (not CLIENTs)
  const isWsAdmin = isWorkspaceAdmin(project.workspace.members, inviterId);
  const isProjectMember = project.members.some((m) => m.userId === inviterId && m.role === 'MEMBER');
  if (!isWsAdmin && !isProjectMember) throw new AppError(403, 'Not authorized to invite');

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

  const inviteUrl = `${env.CLIENT_URL}/invite/${invite.token}`;
  await sendEmail({
    to: input.email,
    subject: `You're invited to ${project.name} on CollabSpace`,
    html: inviteEmailTemplate(inviter!.name, project.workspace.name, inviteUrl),
  });

  return { message: 'Invite sent' };
}

export async function acceptProjectInvite(token: string, userId: string) {
  const [invite, actor] = await Promise.all([
    prisma.inviteToken.findUnique({ where: { token } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  if (!invite || invite.expiresAt < new Date() || invite.acceptedAt) {
    throw new AppError(400, 'Invalid or expired invite');
  }
  if (!invite.projectId) throw new AppError(400, 'Invalid invite type');
  if (!actor || actor.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AppError(403, 'This invite was not sent to your email address');
  }

  const exists = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invite.projectId, userId } },
  });
  if (exists) throw new AppError(409, 'Already a project member');

  const role = invite.role as 'MEMBER' | 'CLIENT';

  const project = await prisma.project.findUnique({
    where: { id: invite.projectId },
    include: { workspace: { select: { id: true, slug: true } } },
  });

  const txOps: any[] = [
    prisma.projectMember.create({
      data: { projectId: invite.projectId, userId, role },
    }),
    prisma.inviteToken.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ];

  // Ensure the user has workspace membership so they can access the workspace layout
  if (project) {
    const existingWsMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspace.id, userId } },
    });
    if (!existingWsMember) {
      txOps.push(
        prisma.workspaceMember.create({
          data: { workspaceId: project.workspace.id, userId, role: 'MEMBER' },
        }),
      );
    }
  }

  await prisma.$transaction(txOps);

  // Notify the inviter that their invite was accepted
  if (invite.createdById) {
    await prisma.notification.create({
      data: {
        recipientId: invite.createdById,
        actorId: userId,
        type: 'INVITE_ACCEPTED',
        meta: { projectId: invite.projectId },
      },
    });
    io.to(`user:${invite.createdById}`).emit('notification:new');
  }

  return { projectId: invite.projectId, role, workspaceSlug: project?.workspace.slug };
}

export async function getPendingProjectInvites(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: { include: { members: true } } },
  });
  if (!project) throw new AppError(404, 'Project not found');

  const isWsAdmin = isWorkspaceAdmin(project.workspace.members, userId);
  const isProjectMember = project.members.some((m) => m.userId === userId && m.role === 'MEMBER');
  if (!isWsAdmin && !isProjectMember) throw new AppError(403, 'Not authorized');

  return prisma.inviteToken.findMany({
    where: {
      projectId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function assertWorkspaceMember(members: { userId: string }[], userId: string) {
  if (!members.some((m) => m.userId === userId)) throw new AppError(403, 'Not a workspace member');
}

export function assertProjectMember(members: { userId: string; role: string }[], userId: string) {
  if (!members.some((m) => m.userId === userId)) throw new AppError(403, 'Not a project member');
}
