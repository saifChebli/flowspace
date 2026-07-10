import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

async function assertProjectMember(projectId: string, userId: string) {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!m) throw new AppError(403, 'Not a project member');
  return m;
}

// ponytail: ILIKE `contains`, no index — swap to Postgres tsvector + GIN when slow.
export async function searchProject(projectId: string, userId: string, q: string) {
  const query = q.trim();
  if (query.length < 2) return { messages: [], tasks: [], files: [] };

  const member = await assertProjectMember(projectId, userId);

  // Same channel-visibility rule as messages/service: clients see CLIENT_VISIBLE
  // only; team members see everything except PRIVATE channels they're not in.
  const channelWhere =
    member.role === 'CLIENT'
      ? { projectId, type: 'CLIENT_VISIBLE' as const }
      : { projectId, OR: [{ type: { not: 'PRIVATE' as const } }, { members: { some: { userId } } }] };

  const like = { contains: query, mode: 'insensitive' as const };

  const [messages, tasks, files] = await Promise.all([
    prisma.message.findMany({
      where: { channel: channelWhere, body: like, deletedAt: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, body: true, createdAt: true, channel: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({
      where: { list: { board: { projectId } }, deletedAt: null, OR: [{ title: like }, { description: like }] },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, listId: true },
    }),
    prisma.file.findMany({
      where: { projectId, name: like },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, url: true },
    }),
  ]);

  return { messages, tasks, files };
}
