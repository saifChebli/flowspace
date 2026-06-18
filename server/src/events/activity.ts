import { prisma } from '../lib/prisma';

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_MOVED'
  | 'TASK_COMPLETED'
  | 'MESSAGE_SENT'
  | 'FILE_UPLOADED'
  | 'MEMBER_JOINED';

interface LogActivityParams {
  projectId: string;
  actorId?: string | null;
  type: ActivityType;
  clientVisible?: boolean;
  meta?: Record<string, unknown>;
}

/**
 * Record a project activity event. Denormalizes the actor's name/avatar at write
 * time so the feed renders without extra joins. Never throws — activity logging
 * must not break the primary operation that triggered it.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    let actor: { id: string; name: string; avatarUrl: string | null } | null = null;
    if (params.actorId) {
      const u = await prisma.user.findUnique({
        where: { id: params.actorId },
        select: { id: true, name: true, avatarUrl: true },
      });
      if (u) actor = u;
    }

    await prisma.activityLog.create({
      data: {
        projectId: params.projectId,
        actorId: params.actorId ?? null,
        type: params.type,
        clientVisible: params.clientVisible ?? false,
        meta: { ...(params.meta ?? {}), actor },
      },
    });
  } catch (err) {
    // Swallow — logging failures should never surface to the caller.
    console.error('[activity] failed to log', params.type, err);
  }
}
