import { prisma } from '../../lib/prisma';

export interface PublicStats {
  workspaces: number;
  tasksCompleted: number;
  projects: number;
}

// Simple in-memory cache — the landing page is public and can be hit often,
// but these numbers only need to be roughly current.
let cache: { data: PublicStats; expiresAt: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getPublicStats(): Promise<PublicStats> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const [workspaces, tasksCompleted, projects] = await Promise.all([
    prisma.workspace.count(),
    prisma.task.count({ where: { completedAt: { not: null }, deletedAt: null } }),
    prisma.project.count({ where: { archived: false } }),
  ]);

  const data = { workspaces, tasksCompleted, projects };
  cache = { data, expiresAt: Date.now() + TTL_MS };
  return data;
}
