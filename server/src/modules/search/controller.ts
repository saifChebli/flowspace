import { Request, Response, NextFunction } from 'express';
import * as svc from './service';

// GET /api/projects/:projectId/search?q=...  (team or portal client)
export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ?? req.portalUser?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(await svc.searchProject(req.params.projectId, userId, q));
  } catch (err) { next(err); }
}
