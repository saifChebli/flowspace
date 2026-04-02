import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { sendMessageSchema, editMessageSchema, listMessagesSchema } from './schema';

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const input = sendMessageSchema.parse(req.body);
    res.status(201).json(await svc.sendMessage(req.params.channelId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = listMessagesSchema.parse(req.query);
    res.json(await svc.listMessages(req.params.channelId, req.user!.id, cursor, limit));
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
