import { Request, Response, NextFunction } from 'express';
import * as svc from './service';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getStats()); } catch (err) { next(err); }
}

export async function listWorkspaces(req: Request, res: Response, next: NextFunction) {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    res.json(await svc.listWorkspaces(cursor));
  } catch (err) { next(err); }
}

export async function getWorkspace(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getWorkspaceDetail(req.params.id)); } catch (err) { next(err); }
}

export async function deleteWorkspace(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.deleteWorkspace(req.params.id)); } catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    res.json(await svc.listUsers(q, cursor));
  } catch (err) { next(err); }
}

export async function suspendUser(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.suspendUser(req.params.id)); } catch (err) { next(err); }
}

export async function unsuspendUser(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.unsuspendUser(req.params.id)); } catch (err) { next(err); }
}

export async function revokeInvite(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.revokeInvite(req.params.id)); } catch (err) { next(err); }
}
