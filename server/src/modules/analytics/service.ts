import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { getPlanFeatures } from '../plans/service';
import { toCsv } from '../../lib/csv';

const DAY_MS = 24 * 60 * 60 * 1000;

async function assertAnalyticsAccess(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: { members: true },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');

  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) throw new AppError(403, 'Not a workspace member');
  if (member.role !== 'ADMIN') throw new AppError(403, 'Admin access required');

  const features = await getPlanFeatures(workspace.id);
  if (!features.analytics) {
    throw new AppError(403, 'Team analytics is an Agency plan feature.');
  }
  return workspace;
}

export interface TeamReport {
  range: { days: number; from: string; to: string };
  totals: {
    created: number;
    completed: number;
    openTasks: number;
    overdueTasks: number;
    completionRate: number; // 0–100
    avgCycleTimeDays: number | null;
    minutesLogged: number;
  };
  throughput: { day: string; completed: number }[];
  members: {
    userId: string;
    name: string;
    assignedOpen: number;
    completed: number;
    minutesLogged: number;
  }[];
  projects: { id: string; name: string; open: number; completed: number; overdue: number }[];
}

export async function getTeamReport(slug: string, userId: string, days = 30): Promise<TeamReport> {
  const workspace = await assertAnalyticsAccess(slug, userId);
  const from = new Date(Date.now() - days * DAY_MS);
  const now = new Date();
  const inWorkspace = { list: { board: { project: { workspaceId: workspace.id } } }, deletedAt: null };

  const [created, completedTasks, openTasks, overdueTasks, projects, timeEntries] = await Promise.all([
    prisma.task.count({ where: { ...inWorkspace, createdAt: { gte: from } } }),
    prisma.task.findMany({
      where: { ...inWorkspace, completedAt: { gte: from } },
      select: { completedAt: true, createdAt: true },
    }),
    prisma.task.count({ where: { ...inWorkspace, completedAt: null } }),
    prisma.task.count({ where: { ...inWorkspace, completedAt: null, dueDate: { lt: now } } }),
    prisma.project.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
    }),
    prisma.taskTimeEntry.findMany({
      where: { task: inWorkspace, date: { gte: from } },
      select: { minutes: true, userId: true },
    }),
  ]);

  // Cycle time = created → completed, averaged over tasks completed in range.
  const cycleTimes = completedTasks
    .filter((t) => t.completedAt)
    .map((t) => (t.completedAt!.getTime() - t.createdAt.getTime()) / DAY_MS)
    .filter((d) => d >= 0);
  const avgCycleTimeDays = cycleTimes.length
    ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10
    : null;

  // Daily throughput, gap-filled so the chart has a continuous axis.
  const byDay = new Map<string, number>();
  for (const t of completedTasks) {
    if (!t.completedAt) continue;
    const key = t.completedAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const throughput: { day: string; completed: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    throughput.push({ day, completed: byDay.get(day) ?? 0 });
  }

  // Per-member load.
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    select: { userId: true, user: { select: { name: true } } },
  });
  const minutesByUser = new Map<string, number>();
  for (const e of timeEntries) minutesByUser.set(e.userId, (minutesByUser.get(e.userId) ?? 0) + e.minutes);

  const memberStats = await Promise.all(
    members.map(async (m) => {
      const [assignedOpen, completed] = await Promise.all([
        prisma.task.count({
          where: { ...inWorkspace, completedAt: null, assignees: { some: { userId: m.userId } } },
        }),
        prisma.task.count({
          where: { ...inWorkspace, completedAt: { gte: from }, assignees: { some: { userId: m.userId } } },
        }),
      ]);
      return {
        userId: m.userId,
        name: m.user.name,
        assignedOpen,
        completed,
        minutesLogged: minutesByUser.get(m.userId) ?? 0,
      };
    }),
  );

  // Per-project breakdown.
  const projectStats = await Promise.all(
    projects.map(async (p) => {
      const scope = { list: { board: { projectId: p.id } }, deletedAt: null };
      const [open, completed, overdue] = await Promise.all([
        prisma.task.count({ where: { ...scope, completedAt: null } }),
        prisma.task.count({ where: { ...scope, completedAt: { gte: from } } }),
        prisma.task.count({ where: { ...scope, completedAt: null, dueDate: { lt: now } } }),
      ]);
      return { id: p.id, name: p.name, open, completed, overdue };
    }),
  );

  const completedCount = completedTasks.length;
  const totalConsidered = completedCount + openTasks;

  return {
    range: { days, from: from.toISOString(), to: now.toISOString() },
    totals: {
      created,
      completed: completedCount,
      openTasks,
      overdueTasks,
      completionRate: totalConsidered > 0 ? Math.round((completedCount / totalConsidered) * 100) : 0,
      avgCycleTimeDays,
      minutesLogged: timeEntries.reduce((a, e) => a + e.minutes, 0),
    },
    throughput,
    members: memberStats.sort((a, b) => b.completed - a.completed),
    projects: projectStats.sort((a, b) => b.open - a.open),
  };
}

/** Same data as a CSV, for the "reporting" half of the feature. */
export async function getTeamReportCsv(slug: string, userId: string, days = 30): Promise<string> {
  const report = await getTeamReport(slug, userId, days);
  return toCsv(
    report.members.map((m) => ({
      member: m.name,
      open_tasks: m.assignedOpen,
      completed_in_range: m.completed,
      hours_logged: (m.minutesLogged / 60).toFixed(1),
    })),
  );
}
