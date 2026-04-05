import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

// ── helpers ──────────────────────────────────────────────────────────────────

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}

// ── Project dashboard stats ─────────────────────────────────────────────────

export async function getProjectDashboard(projectId: string, userId: string) {
  const member = await assertProjectMember(projectId, userId);
  const isClient = member.role === 'CLIENT';

  // Run aggregations in parallel
  const [
    project,
    taskStats,
    priorityCounts,
    memberCount,
    fileCount,
    recentFiles,
    channelCount,
    boardLanes,
  ] = await Promise.all([
    // Basic project info
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { id: true, name: true, description: true, archived: true, createdAt: true },
    }),

    // Task statistics – count by completion status
    prisma.task.groupBy({
      by: ['completedAt'],
      where: {
        list: { board: { projectId } },
      },
      _count: { id: true },
    }),

    // Tasks by priority
    prisma.task.groupBy({
      by: ['priority'],
      where: {
        list: { board: { projectId } },
        completedAt: null,
      },
      _count: { id: true },
    }),

    // Member count
    prisma.projectMember.count({ where: { projectId } }),

    // File count
    prisma.file.count({ where: { projectId } }),

    // Recent files (last 5)
    prisma.file.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),

    // Channel count (filtered for clients)
    prisma.channel.count({
      where: {
        projectId,
        ...(isClient ? { type: 'CLIENT_VISIBLE' } : {}),
      },
    }),

    // Board lanes with task counts
    prisma.boardList.findMany({
      where: { board: { projectId } },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        name: true,
        position: true,
        board: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
        tasks: {
          where: { completedAt: null },
          select: { id: true },
        },
      },
    }),
  ]);

  // Derive task numbers
  let totalTasks = 0;
  let completedTasks = 0;
  for (const row of taskStats) {
    totalTasks += row._count.id;
    if (row.completedAt !== null) completedTasks += row._count.id;
  }
  const openTasks = totalTasks - completedTasks;

  // Priority breakdown
  const priorityMap: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  for (const row of priorityCounts) {
    priorityMap[row.priority] = row._count.id;
  }

  // Overdue tasks
  const overdueTasks = await prisma.task.count({
    where: {
      list: { board: { projectId } },
      completedAt: null,
      dueDate: { lt: new Date() },
    },
  });

  // Lanes summary
  const lanes = boardLanes.map((l: any) => ({
    id: l.id,
    name: l.name,
    boardName: l.board.name,
    totalTasks: l._count.tasks,
    openTasks: l.tasks.length,
  }));

  // Client visibility score: % of channels that are CLIENT_VISIBLE
  let clientVisibilityScore: number | null = null;
  if (!isClient) {
    const allChannels = await prisma.channel.count({ where: { projectId } });
    const clientChannels = await prisma.channel.count({
      where: { projectId, type: 'CLIENT_VISIBLE' },
    });
    clientVisibilityScore = allChannels > 0 ? Math.round((clientChannels / allChannels) * 100) : 0;
  }

  return {
    project,
    stats: {
      totalTasks,
      openTasks,
      completedTasks,
      overdueTasks,
      members: memberCount,
      files: fileCount,
      channels: channelCount,
      priority: priorityMap,
    },
    lanes,
    recentFiles,
    clientVisibilityScore,
    role: member.role,
  };
}

// ── Activity feed ───────────────────────────────────────────────────────────

export async function getProjectActivity(
  projectId: string,
  userId: string,
  cursor?: string,
  limit = 20
) {
  const member = await assertProjectMember(projectId, userId);
  const isClient = member.role === 'CLIENT';

  // Gather recent messages as activity items
  const messages = await prisma.message.findMany({
    where: {
      channel: {
        projectId,
        ...(isClient ? { type: 'CLIENT_VISIBLE' } : {}),
      },
      deletedAt: null,
      parentId: null,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 2),
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true, avatarUrl: true } },
      channel: { select: { id: true, name: true, type: true } },
    },
  });

  // Gather recent task events (creation / completion) via notifications
  const taskNotifications = await prisma.notification.findMany({
    where: {
      task: { list: { board: { projectId } } },
      type: { in: ['TASK_ASSIGNED', 'FILE_UPLOADED'] },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 2),
    select: {
      id: true,
      type: true,
      meta: true,
      createdAt: true,
      actor: { select: { id: true, name: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
    },
  });

  // Also gather recent task comments
  const taskComments = await prisma.taskComment.findMany({
    where: {
      task: { list: { board: { projectId } } },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 3),
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
    },
  });

  // Merge and sort by createdAt desc
  type ActivityItem = {
    id: string;
    kind: 'message' | 'notification' | 'comment';
    title: string;
    meta: string;
    actor: { id: string; name: string; avatarUrl: string | null } | null;
    createdAt: Date;
  };

  const items: ActivityItem[] = [];

  for (const m of messages) {
    items.push({
      id: `msg-${m.id}`,
      kind: 'message',
      title: m.body.length > 80 ? m.body.slice(0, 80) + '…' : m.body,
      meta: `#${m.channel.name}`,
      actor: m.author,
      createdAt: m.createdAt,
    });
  }

  for (const n of taskNotifications) {
    const label =
      n.type === 'TASK_ASSIGNED'
        ? `Assigned to "${n.task?.title ?? 'task'}"`
        : `File uploaded`;
    items.push({
      id: `notif-${n.id}`,
      kind: 'notification',
      title: label,
      meta: n.task?.title ?? '',
      actor: n.actor,
      createdAt: n.createdAt,
    });
  }

  for (const c of taskComments) {
    items.push({
      id: `comment-${c.id}`,
      kind: 'comment',
      title: c.body.length > 80 ? c.body.slice(0, 80) + '…' : c.body,
      meta: `on "${c.task.title}"`,
      actor: c.author,
      createdAt: c.createdAt,
    });
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const sliced = items.slice(0, limit);

  const nextCursor = sliced.length === limit ? sliced[sliced.length - 1].createdAt.toISOString() : null;

  return { items: sliced, nextCursor };
}

// ── Client portal view ──────────────────────────────────────────────────────

export async function getClientPortal(projectId: string, userId: string) {
  const member = await assertProjectMember(projectId, userId);

  // Always filter to client-visible data, regardless of role
  const [project, channels, recentMessages, files, lanes] = await Promise.all([
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { id: true, name: true, description: true },
    }),

    // Only CLIENT_VISIBLE channels
    prisma.channel.findMany({
      where: { projectId, type: 'CLIENT_VISIBLE' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: { select: { messages: true } },
      },
    }),

    // Recent messages in client-visible channels
    prisma.message.findMany({
      where: {
        channel: { projectId, type: 'CLIENT_VISIBLE' },
        deletedAt: null,
        parentId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
        channel: { select: { id: true, name: true } },
      },
    }),

    // Project files (all visible)
    prisma.file.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        mimeType: true,
        sizeBytes: true,
        url: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),

    // Board lanes (high-level progress)
    prisma.boardList.findMany({
      where: { board: { projectId } },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { tasks: true } },
      },
    }),
  ]);

  const totalTasks = lanes.reduce((sum: number, l: any) => sum + l._count.tasks, 0);

  return {
    project,
    channels,
    recentMessages,
    files,
    lanes: lanes.map((l: any) => ({
      id: l.id,
      name: l.name,
      taskCount: l._count.tasks,
    })),
    totalTasks,
    role: member.role,
  };
}
