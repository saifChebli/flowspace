import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { sendEmail, digestEmailTemplate, dueReminderEmailTemplate } from '../lib/email';

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

// ponytail: in-process, single instance — multi-instance would double-send;
// add a DB lock/flag then. The 24h due window means each task reminds ~once.
export function startScheduler(): void {
  cron.schedule('0 8 * * *', () => { sendDigests().catch((e) => console.error('[digest]', e)); });
  cron.schedule('0 8 * * *', () => { sendDueReminders().catch((e) => console.error('[due-reminder]', e)); });
}
