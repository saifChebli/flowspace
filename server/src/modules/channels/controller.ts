import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { getActor } from '../../lib/actor';
import { createChannelSchema, updateChannelSchema } from './schema';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createChannelSchema.parse(req.body);
    res.status(201).json(await svc.createChannel(req.params.projectId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getChannels(req.params.projectId, getActor(req)));
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

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.markChannelRead(req.params.channelId, getActor(req)));
  } catch (err) { next(err); }
}

export async function join(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.joinChannel(req.params.channelId, req.user!.id));
  } catch (err) { next(err); }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }
    res.json(await svc.addChannelMember(req.params.channelId, req.user!.id, userId));
  } catch (err) { next(err); }
}
