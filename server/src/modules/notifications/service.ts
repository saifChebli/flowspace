import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export async function getNotifications(userId: string, cursor?: string, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { id: true, name: true, avatarUrl: true } },
      task: { select: { id: true, title: true } },
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { recipientId: userId, read: false },
  });

  return {
    notifications,
    unreadCount,
    nextCursor: notifications.length === limit ? notifications[notifications.length - 1]?.id : undefined,
  };
}

export async function markRead(notificationId: string, userId: string) {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw new AppError(404, 'Notification not found');
  if (notif.recipientId !== userId) throw new AppError(403, 'Forbidden');

  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });
  return { message: 'All notifications marked as read' };
}
