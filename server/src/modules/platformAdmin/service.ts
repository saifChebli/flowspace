import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export async function getStats() {
  const [users, workspaces, projects, signupRows] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.project.count(),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "users"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  return {
    totals: { users, workspaces, projects },
    signupsLast30Days: signupRows.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: Number(r.count) })),
  };
}

export async function listWorkspaces(cursor?: string, limit = 30) {
  const workspaces = await prisma.workspace.findMany({
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { members: true, projects: true } } },
  });
  return { items: workspaces, nextCursor: workspaces.length === limit ? workspaces[workspaces.length - 1].id : undefined };
}

export async function getWorkspaceDetail(id: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      projects: { select: { id: true, name: true, archived: true, createdAt: true } },
    },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  return workspace;
}

export async function deleteWorkspace(id: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  await prisma.workspace.delete({ where: { id } });
  return { message: 'Workspace deleted' };
}

export async function listUsers(q?: string, cursor?: string, limit = 30) {
  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: 'insensitive' } } : undefined,
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, emailVerified: true, suspendedAt: true, createdAt: true,
      _count: { select: { workspaceMembers: true } },
    },
  });
  return { items: users, nextCursor: users.length === limit ? users[users.length - 1].id : undefined };
}

export async function suspendUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { suspendedAt: new Date() } }),
    prisma.refreshToken.deleteMany({ where: { userId: id } }),
  ]);
  return { message: 'User suspended' };
}

export async function unsuspendUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');

  await prisma.user.update({ where: { id }, data: { suspendedAt: null } });
  return { message: 'User unsuspended' };
}

export async function revokeInvite(id: string) {
  const invite = await prisma.inviteToken.findUnique({ where: { id } });
  if (!invite) throw new AppError(404, 'Invite not found');
  await prisma.inviteToken.delete({ where: { id } });
  return { message: 'Invite revoked' };
}
