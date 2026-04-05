import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateChannelInput, UpdateChannelInput } from './schema';

export async function createChannel(projectId: string, userId: string, input: CreateChannelInput) {
  const member = await assertProjectMember(projectId, userId);
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot create channels');

  const existing = await prisma.channel.findUnique({
    where: { projectId_name: { projectId, name: input.name } },
  });
  if (existing) throw new AppError(409, 'Channel name already exists in this project');

  const channel = await prisma.channel.create({
    data: {
      projectId,
      ...input,
      // Creator auto-joins private channels
      ...(input.type === 'PRIVATE'
        ? { members: { create: { userId } } }
        : {}),
    },
  });

  return channel;
}

export async function getChannels(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');

  const isClient = member.role === 'CLIENT';

  const channels = await prisma.channel.findMany({
    where: {
      projectId,
      ...(isClient ? { type: 'CLIENT_VISIBLE' } : {}),
      // For non-client members: show public + client_visible always,
      // show private only if user is a channel member
      ...(!isClient ? {
        OR: [
          { type: { not: 'PRIVATE' } },
          { members: { some: { userId } } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      reads: { where: { userId }, take: 1 },
      _count: { select: { messages: true, members: true } },
    },
  });

  // Compute unreadCount per channel
  const results = await Promise.all(
    channels.map(async (ch) => {
      const lastRead = ch.reads[0]?.lastReadAt;
      const unreadCount = await prisma.message.count({
        where: {
          channelId: ch.id,
          deletedAt: null,
          ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
        },
      });
      const { reads, _count, ...rest } = ch;
      return { ...rest, unreadCount, memberCount: _count.members };
    })
  );

  return results;
}

export async function updateChannel(channelId: string, userId: string, input: UpdateChannelInput) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  const member = await assertProjectMember(channel.projectId, userId);
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot modify channels');

  return prisma.channel.update({ where: { id: channelId }, data: input });
}

export async function markChannelRead(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  await assertProjectMember(channel.projectId, userId);

  return prisma.channelRead.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: { lastReadAt: new Date() },
    create: { channelId, userId },
  });
}

export async function deleteChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  const member = await assertProjectMember(channel.projectId, userId);
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot delete channels');

  await prisma.channel.delete({ where: { id: channelId } });
  return { message: 'Channel deleted' };
}

export async function joinChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  await assertProjectMember(channel.projectId, userId);

  if (channel.type !== 'PUBLIC') {
    throw new AppError(403, 'Only public channels can be joined directly');
  }

  return prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: {},
    create: { channelId, userId },
  });
}

export async function addChannelMember(channelId: string, userId: string, targetUserId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  await assertProjectMember(channel.projectId, userId);
  await assertProjectMember(channel.projectId, targetUserId);

  // For private channels, only existing members can add others
  if (channel.type === 'PRIVATE') {
    const isMember = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!isMember) throw new AppError(403, 'Only channel members can invite to private channels');
  }

  return prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId: targetUserId } },
    update: {},
    create: { channelId, userId: targetUserId },
  });
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}
