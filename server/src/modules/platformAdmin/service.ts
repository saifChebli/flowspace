import type { Plan } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { buildActivityCopy } from '../dashboard/service';
import { AppError } from '../../middleware/errorHandler';

export async function getStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    users, workspaces, projects, messages, tasks, files,
    suspended, activeUsers7d, signupRows, recentUsers, recentWorkspaces,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.project.count(),
    prisma.message.count({ where: { deletedAt: null } }),
    prisma.task.count({ where: { deletedAt: null } }),
    prisma.file.count(),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    // Distinct actors in the activity log over the last 7 days
    prisma.activityLog.findMany({
      where: { createdAt: { gte: weekAgo }, actorId: { not: null } },
      distinct: ['actorId'],
      select: { actorId: true },
    }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "users"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, createdAt: true, _count: { select: { members: true, projects: true } } },
    }),
  ]);

  // Fill gaps so the chart shows a continuous 30-day axis.
  const counts = new Map(signupRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  const signupsLast30Days: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    signupsLast30Days.push({ day: d, count: counts.get(d) ?? 0 });
  }

  return {
    totals: { users, workspaces, projects, messages, tasks, files, suspended, activeUsers7d: activeUsers7d.length },
    signupsLast30Days,
    recentUsers,
    recentWorkspaces,
  };
}

export async function listWorkspaces(q?: string, cursor?: string, limit = 30) {
  const workspaces = await prisma.workspace.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] }
      : undefined,
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { members: true, projects: true } } },
  });

  // Storage used + last activity per workspace (small page size keeps this cheap).
  const items = await Promise.all(
    workspaces.map(async (w) => {
      const [storage, lastActivity] = await Promise.all([
        prisma.file.aggregate({ where: { project: { workspaceId: w.id } }, _sum: { sizeBytes: true } }),
        prisma.activityLog.findFirst({
          where: { project: { workspaceId: w.id } },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);
      return {
        ...w,
        storageBytes: storage._sum.sizeBytes ?? 0,
        lastActivityAt: lastActivity?.createdAt ?? null,
      };
    }),
  );

  return { items, nextCursor: items.length === limit ? items[items.length - 1].id : undefined };
}

export async function getWorkspaceDetail(id: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, suspendedAt: true } } } },
      projects: { select: { id: true, name: true, archived: true, createdAt: true } },
    },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');

  const [storage, messages, tasks, activity] = await Promise.all([
    prisma.file.aggregate({ where: { project: { workspaceId: id } }, _sum: { sizeBytes: true }, _count: true }),
    prisma.message.count({ where: { channel: { project: { workspaceId: id } }, deletedAt: null } }),
    prisma.task.count({ where: { list: { board: { project: { workspaceId: id } } }, deletedAt: null } }),
    prisma.activityLog.findMany({
      where: { project: { workspaceId: id } },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { project: { select: { name: true } } },
    }),
  ]);

  return {
    ...workspace,
    usage: {
      storageBytes: storage._sum.sizeBytes ?? 0,
      files: storage._count,
      messages,
      tasks,
    },
    activity: activity.map((a) => {
      const meta = (a.meta ?? {}) as Record<string, any>;
      return {
        id: a.id,
        type: a.type,
        ...buildActivityCopy(a.type, meta),
        actor: (meta.actor ?? null) as { name: string } | null,
        project: a.project,
        createdAt: a.createdAt,
      };
    }),
  };
}

/** Manually grant/downgrade a plan — lets us comp early users before billing exists. */
export async function setWorkspacePlan(id: string, plan: Plan, expiresAt?: string | null) {
  if (!['FREE', 'PRO', 'AGENCY'].includes(plan)) throw new AppError(400, 'Invalid plan');
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) throw new AppError(404, 'Workspace not found');

  await prisma.workspace.update({
    where: { id },
    data: { plan, planExpiresAt: expiresAt ? new Date(expiresAt) : null },
  });
  return { message: `Plan set to ${plan}` };
}

export async function deleteWorkspace(id: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  await prisma.workspace.delete({ where: { id } });
  return { message: 'Workspace deleted' };
}

export async function listUsers(q?: string, cursor?: string, limit = 30, suspendedOnly = false) {
  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { name: { contains: q, mode: 'insensitive' as const } }] }
        : {}),
      ...(suspendedOnly ? { suspendedAt: { not: null } } : {}),
    },
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
    // Portal sessions are separate credentials with a 90-day sliding expiry, so
    // suspension has to revoke them too.
    prisma.portalSession.deleteMany({ where: { userId: id } }),
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
