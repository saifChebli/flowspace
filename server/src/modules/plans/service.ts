import type { Plan } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

const GB = 1024 * 1024 * 1024;

/** Limits as advertised on the pricing page. null = unlimited. */
export const PLAN_LIMITS: Record<Plan, { label: string; projects: number | null; storageBytes: number }> = {
  FREE: { label: 'Free', projects: 3, storageBytes: 1 * GB },
  PRO: { label: 'Pro', projects: null, storageBytes: 20 * GB },
  AGENCY: { label: 'Agency', projects: null, storageBytes: 100 * GB },
};

/**
 * A paid plan past its expiry silently falls back to FREE limits, so a lapsed
 * subscription can never keep granting paid capacity.
 */
export function effectivePlan(workspace: { plan: Plan; planExpiresAt: Date | null }): Plan {
  if (workspace.plan !== 'FREE' && workspace.planExpiresAt && workspace.planExpiresAt < new Date()) {
    return 'FREE';
  }
  return workspace.plan;
}

/** Feature gates by plan (as advertised on the pricing page). */
export const PLAN_FEATURES = {
  FREE: { whiteLabel: false, analytics: false, advancedFilters: false },
  PRO: { whiteLabel: false, analytics: false, advancedFilters: true },
  AGENCY: { whiteLabel: true, analytics: true, advancedFilters: true },
} as const satisfies Record<Plan, Record<string, boolean>>;

export async function getPlanFeatures(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');
  return PLAN_FEATURES[effectivePlan(workspace)];
}

export interface WorkspaceUsage {
  plan: Plan;
  planLabel: string;
  planExpiresAt: Date | null;
  projects: { used: number; limit: number | null };
  storage: { usedBytes: number; limitBytes: number };
}

// ponytail: storage is summed on demand rather than kept in a counter column —
// a counter can drift (failed deletes, direct DB edits) and drift here means
// wrong billing enforcement. Add a cached counter only if this SUM gets slow.
export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!workspace) throw new AppError(404, 'Workspace not found');

  const plan = effectivePlan(workspace);
  const limits = PLAN_LIMITS[plan];

  const [projects, storage] = await Promise.all([
    prisma.project.count({ where: { workspaceId, archived: false } }),
    prisma.file.aggregate({ where: { project: { workspaceId } }, _sum: { sizeBytes: true } }),
  ]);

  return {
    plan,
    planLabel: limits.label,
    planExpiresAt: workspace.planExpiresAt,
    projects: { used: projects, limit: limits.projects },
    storage: { usedBytes: storage._sum.sizeBytes ?? 0, limitBytes: limits.storageBytes },
  };
}

export async function assertCanCreateProject(workspaceId: string): Promise<void> {
  const usage = await getWorkspaceUsage(workspaceId);
  const limit = usage.projects.limit;
  if (limit !== null && usage.projects.used >= limit) {
    throw new AppError(
      403,
      `Your ${usage.planLabel} plan allows ${limit} active projects. Archive a project or upgrade to add more.`,
    );
  }
}

export async function assertCanUpload(workspaceId: string, sizeBytes: number): Promise<void> {
  const usage = await getWorkspaceUsage(workspaceId);
  if (usage.storage.usedBytes + sizeBytes > usage.storage.limitBytes) {
    throw new AppError(
      403,
      `This upload would exceed your ${usage.planLabel} plan's ${formatBytes(usage.storage.limitBytes)} storage limit. Delete some files or upgrade for more space.`,
    );
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < GB) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(bytes % GB === 0 ? 0 : 1)} GB`;
}
