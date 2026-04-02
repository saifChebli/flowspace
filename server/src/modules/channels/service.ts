import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateChannelInput, UpdateChannelInput } from './schema';

export async function createChannel(projectId: string, userId: string, input: CreateChannelInput) {
  await assertProjectMember(projectId, userId);

  const existing = await prisma.channel.findUnique({
    where: { projectId_name: { projectId, name: input.name } },
  });
  if (existing) throw new AppError(409, 'Channel name already exists in this project');

  return prisma.channel.create({ data: { projectId, ...input } });
}

export async function getChannels(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');

  const isClient = member.role === 'CLIENT';

  return prisma.channel.findMany({
    where: {
      projectId,
      ...(isClient ? { type: 'CLIENT_VISIBLE' } : {}),
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateChannel(channelId: string, userId: string, input: UpdateChannelInput) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  await assertProjectMember(channel.projectId, userId);

  return prisma.channel.update({ where: { id: channelId }, data: input });
}

export async function deleteChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new AppError(404, 'Channel not found');
  await assertProjectMember(channel.projectId, userId);

  await prisma.channel.delete({ where: { id: channelId } });
  return { message: 'Channel deleted' };
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}
