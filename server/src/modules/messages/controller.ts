import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { sendMessageSchema, editMessageSchema, listMessagesSchema } from './schema';

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ?? req.portalUser?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const input = sendMessageSchema.parse(req.body);
    res.status(201).json(await svc.sendMessage(req.params.channelId, userId, input));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ?? req.portalUser?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { cursor, limit } = listMessagesSchema.parse(req.query);
    res.json(await svc.listMessages(req.params.channelId, userId, cursor, limit));
  } catch (err) { next(err); }
}

export async function edit(req: Request, res: Response, next: NextFunction) {
  try {
    const input = editMessageSchema.parse(req.body);
    res.json(await svc.editMessage(req.params.messageId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteMessage(req.params.messageId, req.user!.id));
  } catch (err) { next(err); }
}

export async function listThread(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ?? req.portalUser?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    res.json(await svc.listThreadReplies(req.params.messageId, userId));
  } catch (err) { next(err); }
}
