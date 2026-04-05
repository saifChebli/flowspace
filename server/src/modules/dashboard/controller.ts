import { Request, Response, NextFunction } from 'express';
import * as svc from './service';

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
    const limit = typeof req.query.limit === 'string' ? Math.min(parseInt(req.query.limit, 10), 50) : 20;
    const result = await svc.getProjectActivity(req.params.projectId, req.user!.id, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getClientPortal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ?? req.portalUser?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await svc.getClientPortal(req.params.projectId, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
