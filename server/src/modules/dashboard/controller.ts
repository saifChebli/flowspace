import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { getActor } from '../../lib/actor';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getProjectDashboard(req.params.projectId, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    // Guard against NaN — `parseInt('abc')` previously reached Prisma as `take: NaN` → 500.
    const parsed = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;
    const result = await svc.getProjectActivity(req.params.projectId, req.user!.id, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getClientPortal(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getClientPortal(req.params.projectId, getActor(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
}
