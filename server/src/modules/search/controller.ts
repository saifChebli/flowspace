import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { getActor } from '../../lib/actor';

// GET /api/projects/:projectId/search?q=...  (team or portal client)
export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(await svc.searchProject(req.params.projectId, getActor(req), q));
  } catch (err) { next(err); }
}
