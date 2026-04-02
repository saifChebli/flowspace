import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { createChannelSchema, updateChannelSchema } from './schema';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createChannelSchema.parse(req.body);
    res.status(201).json(await svc.createChannel(req.params.projectId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getChannels(req.params.projectId, req.user!.id));
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateChannelSchema.parse(req.body);
    res.json(await svc.updateChannel(req.params.channelId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteChannel(req.params.channelId, req.user!.id));
  } catch (err) { next(err); }
}
