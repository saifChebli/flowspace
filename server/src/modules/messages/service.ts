import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { SendMessageInput, EditMessageInput } from './schema';

export async function sendMessage(channelId: string, authorId: string, input: SendMessageInput) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: channel.projectId, userId: authorId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');

  // Clients can only post in CLIENT_VISIBLE channels
  if (member.role === 'CLIENT' && channel.type !== 'CLIENT_VISIBLE') {
    throw new AppError(403, 'Clients can only post in client-visible channels');
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      authorId,
      body: input.body,
      mentions: input.mentionedUserIds?.length
        ? { createMany: { data: input.mentionedUserIds.map((userId) => ({ userId })) } }
        : undefined,
      attachments: input.fileIds?.length
        ? { createMany: { data: input.fileIds.map((fileId) => ({ fileId })) } }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      attachments: { include: { file: true } },
    },
  });

  // Create mention notifications
  if (input.mentionedUserIds?.length) {
    await prisma.notification.createMany({
      data: input.mentionedUserIds.map((userId) => ({
        recipientId: userId,
        actorId: authorId,
        type: 'MESSAGE_MENTIONED' as const,
        meta: { channelId, messageId: message.id },
      })),
    });
  }

  return message;
}

export async function listMessages(
  channelId: string,
  userId: string,
  cursor?: string,
  limit = 50
) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: channel.projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  if (member.role === 'CLIENT' && channel.type !== 'CLIENT_VISIBLE') {
    throw new AppError(403, 'Access denied');
  }

  const messages = await prisma.message.findMany({
    where: { channelId, deletedAt: null },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      attachments: { include: { file: true } },
    },
  });

  return {
    messages: messages.reverse(),
    nextCursor: messages.length === limit ? messages[0]?.id : undefined,
  };
}

export async function editMessage(messageId: string, userId: string, input: EditMessageInput) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new AppError(404, 'Message not found');
  if (message.authorId !== userId) throw new AppError(403, 'Not the message author');

  return prisma.message.update({
    where: { id: messageId },
    data: { body: input.body, editedAt: new Date() },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new AppError(404, 'Message not found');
  if (message.authorId !== userId) throw new AppError(403, 'Not the message author');

  await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date(), body: '[deleted]' } });
  return { message: 'Message deleted' };
}
