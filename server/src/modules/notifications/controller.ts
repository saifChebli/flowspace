import { Request, Response, NextFunction } from 'express';
import * as svc from './service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const cursor = req.query.cursor as string | undefined;
    res.json(await svc.getNotifications(req.user!.id, cursor));
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.markRead(req.params.id, req.user!.id));
  } catch (err) { next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.markAllRead(req.user!.id));
  } catch (err) { next(err); }
}
