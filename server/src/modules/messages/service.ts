import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { io } from '../../server';
import { logActivity } from '../../events/activity';
import { assertChannelAccess, type Actor } from '../../lib/actor';
import type { SendMessageInput, EditMessageInput } from './schema';

export async function sendMessage(channelId: string, actor: Actor, input: SendMessageInput) {
  const { channel } = await assertChannelAccess(channelId, actor);
  const authorId = actor.userId;

  // Everything below is client-supplied and must be constrained to this channel /
  // project — otherwise attachments leak other tenants' file URLs, replies can be
  // grafted into unreadable channels, and mentions can notify arbitrary users.
  const fileIds = [...new Set(input.fileIds ?? [])];
  if (fileIds.length > 0) {
    const owned = await prisma.file.count({
      where: { id: { in: fileIds }, projectId: channel.projectId },
    });
    if (owned !== fileIds.length) throw new AppError(400, 'Unknown attachment');
  }

  if (input.parentId) {
    const parent = await prisma.message.findUnique({
      where: { id: input.parentId },
      select: { channelId: true, deletedAt: true },
    });
    if (!parent || parent.channelId !== channelId || parent.deletedAt) {
      throw new AppError(400, 'Cannot reply to that message');
    }
  }

  const mentionedUserIds = [...new Set(input.mentionedUserIds ?? [])];
  const validMentions = mentionedUserIds.length
    ? (
        await prisma.projectMember.findMany({
          where: { projectId: channel.projectId, userId: { in: mentionedUserIds } },
          select: { userId: true },
        })
      ).map((m) => m.userId)
    : [];

  const message = await prisma.message.create({
    data: {
      channelId,
      authorId,
      body: input.body,
      parentId: input.parentId ?? null,
      mentions: validMentions.length
        ? { createMany: { data: validMentions.map((userId) => ({ userId })) } }
        : undefined,
      attachments: fileIds.length
        ? { createMany: { data: fileIds.map((fileId) => ({ fileId })) } }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      attachments: { include: { file: true } },
      _count: { select: { replies: true } },
    },
  });

  // Create mention notifications (exclude self-mentions)
  const mentionRecipients = validMentions.filter((uid) => uid !== authorId);
  if (mentionRecipients.length > 0) {
    await prisma.notification.createMany({
      data: mentionRecipients.map((userId) => ({
        recipientId: userId,
        actorId: authorId,
        type: 'MESSAGE_MENTIONED' as const,
        meta: { channelId, messageId: message.id },
      })),
    });
    for (const uid of mentionRecipients) {
      io.to(`user:${uid}`).emit('notification:new');
    }
  }

  // Log top-level messages to the project activity feed + broadcast in real time.
  if (!message.parentId) {
    io.to(`channel:${channelId}`).emit('message:new', message);
    await logActivity({
      projectId: channel.projectId,
      actorId: authorId,
      type: 'MESSAGE_SENT',
      clientVisible: channel.type === 'CLIENT_VISIBLE',
      meta: { channelName: channel.name, preview: input.body },
    });
  }

  return message;
}

export async function listMessages(
  channelId: string,
  actor: Actor,
  cursor?: string,
  limit = 50
) {
  await assertChannelAccess(channelId, actor);

  const messages = await prisma.message.findMany({
    where: { channelId, deletedAt: null, parentId: null },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      attachments: { include: { file: true } },
      _count: { select: { replies: true } },
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

export async function listThreadReplies(parentId: string, actor: Actor) {
  const parent = await prisma.message.findUnique({
    where: { id: parentId },
    include: { channel: true },
  });
  if (!parent) throw new AppError(404, 'Message not found');

  // Same visibility rule as reading the channel itself — this previously only
  // checked project membership, so clients and non-members of a PRIVATE channel
  // could read its messages through the thread endpoint.
  await assertChannelAccess(parent.channelId, actor);

  const replies = await prisma.message.findMany({
    where: { parentId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { replies: true } },
    },
  });

  return { replies, parent };
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new AppError(404, 'Message not found');
  if (message.authorId !== userId) throw new AppError(403, 'Not the message author');

  await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date(), body: '[deleted]' } });
  return { message: 'Message deleted' };
}
