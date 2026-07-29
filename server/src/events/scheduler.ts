import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { sendEmail, digestEmailTemplate, dueReminderEmailTemplate, quotaWarningEmailTemplate } from '../lib/email';
import { getWorkspaceUsage, formatBytes } from '../modules/plans/service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Email each user with unread notifications a daily summary. */
export async function sendDigests(): Promise<void> {
  const groups = await prisma.notification.groupBy({
    by: ['recipientId'],
    where: { read: false },
    _count: { _all: true },
  });
  for (const g of groups) {
    const user = await prisma.user.findUnique({
      where: { id: g.recipientId },
      select: { email: true, name: true },
    });
    if (!user) continue;
    const count = g._count._all;
    await sendEmail({
      to: user.email,
      subject: `You have ${count} unread notification${count === 1 ? '' : 's'}`,
      html: digestEmailTemplate(user.name, count, env.CLIENT_URL),
    });
  }
}

/** Email assignees of tasks due within the next 24h. */
export async function sendDueReminders(): Promise<void> {
  const now = new Date();
  const soon = new Date(now.getTime() + DAY_MS);
  const tasks = await prisma.task.findMany({
    where: { dueDate: { gte: now, lte: soon }, completedAt: null, deletedAt: null },
    select: {
      title: true,
      dueDate: true,
      assignees: { select: { user: { select: { email: true, name: true } } } },
      list: { select: { board: { select: { project: { select: { name: true } } } } } },
    },
  });
  for (const t of tasks) {
    const projectName = t.list.board.project.name;
    const dueLabel = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'soon';
    for (const a of t.assignees) {
      await sendEmail({
        to: a.user.email,
        subject: `Task due soon: ${t.title}`,
        html: dueReminderEmailTemplate(a.user.name, t.title, projectName, dueLabel, env.CLIENT_URL),
      });
    }
  }
}

/** Warn workspace admins at 80% and at/over 100% of a plan limit. */
export async function sendQuotaWarnings(): Promise<void> {
  const workspaces = await prisma.workspace.findMany({ select: { id: true, name: true } });

  for (const ws of workspaces) {
    const usage = await getWorkspaceUsage(ws.id);

    const alerts: { what: string; detail: string; atLimit: boolean }[] = [];

    const storagePct = usage.storage.usedBytes / usage.storage.limitBytes;
    if (storagePct >= 0.8) {
      alerts.push({
        what: 'storage',
        detail: `${formatBytes(usage.storage.usedBytes)} of ${formatBytes(usage.storage.limitBytes)} (${Math.round(storagePct * 100)}%)`,
        atLimit: storagePct >= 1,
      });
    }

    const { used, limit } = usage.projects;
    if (limit !== null && used >= limit) {
      alerts.push({ what: 'project', detail: `${used} of ${limit} active projects`, atLimit: true });
    }

    if (alerts.length === 0) continue;

    const admins = await prisma.workspaceMember.findMany({
      where: { workspaceId: ws.id, role: 'ADMIN' },
      select: { user: { select: { email: true, name: true } } },
    });

    for (const alert of alerts) {
      for (const a of admins) {
        await sendEmail({
          to: a.user.email,
          subject: `${ws.name}: ${alert.what} ${alert.atLimit ? 'limit reached' : 'limit approaching'}`,
          html: quotaWarningEmailTemplate(a.user.name, ws.name, alert.what, alert.detail, alert.atLimit, env.CLIENT_URL),
        });
      }
    }
  }
}

// ponytail: in-process, single instance — multi-instance would double-send;
// add a DB lock/flag then. The 24h due window means each task reminds ~once.
// Quota warnings repeat daily while over threshold — acceptable until there's a
// per-workspace "last warned" record to dedupe against.
export function startScheduler(): void {
  cron.schedule('0 8 * * *', () => { sendDigests().catch((e) => console.error('[digest]', e)); });
  cron.schedule('0 8 * * *', () => { sendDueReminders().catch((e) => console.error('[due-reminder]', e)); });
  cron.schedule('30 8 * * *', () => { sendQuotaWarnings().catch((e) => console.error('[quota-warning]', e)); });
}
