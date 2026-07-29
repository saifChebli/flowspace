import type { Request } from 'express';
import type { ChannelType, ProjectRole } from '@prisma/client';
import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Who is making this request, normalised across the two auth schemes.
 *
 * `portalProjectId` is set only for client-portal sessions. It is a *confinement*:
 * a portal token is scoped to one project and must never inherit the underlying
 * user's team role — the same person can be a full MEMBER elsewhere.
 */
export interface Actor {
  userId: string;
  portalProjectId: string | null;
}

export function getActor(req: Request): Actor {
  if (req.user) return { userId: req.user.id, portalProjectId: null };
  if (req.portalUser) {
    return { userId: req.portalUser.userId, portalProjectId: req.portalUser.projectId };
  }
  throw new AppError(401, 'Unauthorized');
}

export interface ProjectAccess {
  projectId: string;
  userId: string;
  /** Effective role — always CLIENT for portal sessions, whatever the membership row says. */
  role: ProjectRole;
  isPortal: boolean;
}

/**
 * Resolve an actor's effective access to a project. Enforces portal confinement
 * before anything else, so a portal token can only ever touch its own project.
 */
export async function resolveProjectAccess(projectId: string, actor: Actor): Promise<ProjectAccess> {
  if (actor.portalProjectId && actor.portalProjectId !== projectId) {
    throw new AppError(403, 'This portal session does not grant access to that project');
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: actor.userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');

  return {
    projectId,
    userId: actor.userId,
    role: actor.portalProjectId ? 'CLIENT' : member.role,
    isPortal: !!actor.portalProjectId,
  };
}

/** Team members only (rejects clients and portal sessions). */
export async function assertTeamAccess(projectId: string, actor: Actor): Promise<ProjectAccess> {
  const access = await resolveProjectAccess(projectId, actor);
  if (access.role === 'CLIENT') throw new AppError(403, 'Clients cannot perform this action');
  return access;
}

export interface ChannelAccess extends ProjectAccess {
  channel: { id: string; projectId: string; type: ChannelType; name: string };
}

/**
 * Single source of truth for "may this actor see this channel?".
 * Clients see CLIENT_VISIBLE only; team members see everything except PRIVATE
 * channels they haven't been added to.
 */
export async function assertChannelAccess(channelId: string, actor: Actor): Promise<ChannelAccess> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, projectId: true, type: true, name: true },
  });
  if (!channel) throw new AppError(404, 'Channel not found');

  const access = await resolveProjectAccess(channel.projectId, actor);

  if (access.role === 'CLIENT' && channel.type !== 'CLIENT_VISIBLE') {
    throw new AppError(403, 'Access denied');
  }

  if (channel.type === 'PRIVATE') {
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: actor.userId } },
    });
    if (!membership) throw new AppError(403, 'Not a member of this private channel');
  }

  return { ...access, channel };
}
