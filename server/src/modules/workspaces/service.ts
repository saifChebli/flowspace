import { prisma } from '../../lib/prisma';
import { sendEmail, inviteEmailTemplate } from '../../lib/email';
import { AppError } from '../../middleware/errorHandler';
import { io } from '../../server';
import { env } from '../../config/env';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, InviteMemberInput, UpdateMemberRoleInput } from './schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  if (slug.length < 2) slug = 'workspace';
  let candidate = slug;
  let suffix = 2;
  while (await prisma.workspace.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
  return candidate;
}

export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  const slug = input.slug ?? await generateUniqueSlug(input.name);

  if (input.slug) {
    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) throw new AppError(409, 'Workspace slug already taken');
  }

  return prisma.workspace.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      members: { create: { userId, role: 'ADMIN' } },
    },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
}

export async function getWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true, projects: true } },
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWorkspace(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      _count: { select: { projects: true } },
    },
  });

  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertMember(workspace.members, userId);
  return workspace;
}

export async function updateWorkspace(slug: string, userId: string, input: UpdateWorkspaceInput) {
  const workspace = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertAdmin(workspace.members, userId);

  return prisma.workspace.update({ where: { slug }, data: input });
}

export async function deleteWorkspace(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertAdmin(workspace.members, userId);

  await prisma.workspace.delete({ where: { slug } });
  return { message: 'Workspace deleted' };
}

export async function inviteMember(slug: string, inviterId: string, input: InviteMemberInput) {
  const workspace = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertAdmin(workspace.members, inviterId);

  const inviter = await prisma.user.findUnique({ where: { id: inviterId }, select: { name: true } });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.inviteToken.create({
    data: {
      email: input.email,
      workspaceId: workspace.id,
      role: input.role,
      createdById: inviterId,
      expiresAt,
    },
  });

  const inviteUrl = `${env.CLIENT_URL}/invites/${invite.token}`;
  await sendEmail({
    to: input.email,
    subject: `You're invited to ${workspace.name} on CollabSpace`,
    html: inviteEmailTemplate(inviter!.name, workspace.name, inviteUrl),
  });

  return { message: 'Invite sent' };
}

export async function acceptInvite(token: string, userId: string) {
  const [invite, actor] = await Promise.all([
    prisma.inviteToken.findUnique({ where: { token } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  if (!invite || invite.expiresAt < new Date()) throw new AppError(400, 'Invalid or expired invite');
  if (invite.acceptedAt) throw new AppError(400, 'Invite already accepted');
  if (!invite.workspaceId) throw new AppError(400, 'Invalid invite type');
  if (!actor || actor.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AppError(403, 'This invite was not sent to your email address');
  }

  const exists = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
  });
  if (exists) throw new AppError(409, 'Already a member');

  const workspace = await prisma.workspace.findUnique({
    where: { id: invite.workspaceId },
    select: { slug: true },
  });

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: invite.role as 'ADMIN' | 'MEMBER' },
    }),
    prisma.inviteToken.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);

  // Notify the inviter that their invite was accepted
  if (invite.createdById) {
    await prisma.notification.create({
      data: {
        recipientId: invite.createdById,
        actorId: userId,
        type: 'INVITE_ACCEPTED',
        meta: { workspaceId: invite.workspaceId },
      },
    });
    io.to(`user:${invite.createdById}`).emit('notification:new');
  }

  return { workspaceId: invite.workspaceId, slug: workspace?.slug };
}

export async function removeMember(slug: string, adminId: string, memberId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertAdmin(workspace.members, adminId);
  if (adminId === memberId) throw new AppError(400, 'Cannot remove yourself');

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: memberId } },
  });

  return { message: 'Member removed' };
}

export async function updateMemberRole(slug: string, adminId: string, memberId: string, input: UpdateMemberRoleInput) {
  const workspace = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertAdmin(workspace.members, adminId);

  if (adminId === memberId && input.role !== 'ADMIN') {
    const adminCount = workspace.members.filter((m) => m.role === 'ADMIN').length;
    if (adminCount <= 1) throw new AppError(400, 'Cannot demote the last admin');
  }

  const target = workspace.members.find((m) => m.userId === memberId);
  if (!target) throw new AppError(404, 'Member not found');

  await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: memberId } },
    data: { role: input.role },
  });

  return { message: 'Role updated' };
}

export async function getPendingInvites(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { slug }, include: { members: true } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  assertAdmin(workspace.members, userId);

  return prisma.inviteToken.findMany({
    where: {
      workspaceId: workspace.id,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function assertMember(members: { userId: string }[], userId: string) {
  if (!members.some((m) => m.userId === userId)) throw new AppError(403, 'Not a workspace member');
}

function assertAdmin(members: { userId: string; role: string }[], userId: string) {
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new AppError(403, 'Not a workspace member');
  if (member.role !== 'ADMIN') throw new AppError(403, 'Admin access required');
}
