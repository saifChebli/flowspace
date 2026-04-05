import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { createTaskSchema, updateTaskSchema, moveTaskSchema, commentSchema, updateCommentSchema, timeEntrySchema } from './schema';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTaskSchema.parse(req.body);
    res.status(201).json(await svc.createTask(req.params.listId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getTask(req.params.taskId, req.user!.id));
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateTaskSchema.parse(req.body);
    res.json(await svc.updateTask(req.params.taskId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function move(req: Request, res: Response, next: NextFunction) {
  try {
    const input = moveTaskSchema.parse(req.body);
    res.json(await svc.moveTask(req.params.taskId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteTask(req.params.taskId, req.user!.id));
  } catch (err) { next(err); }
}

export async function comment(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = commentSchema.parse(req.body);
    res.status(201).json(await svc.addComment(req.params.taskId, req.user!.id, body));
  } catch (err) { next(err); }
}

export async function editComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = updateCommentSchema.parse(req.body);
    res.json(await svc.updateComment(req.params.commentId, req.user!.id, body));
  } catch (err) { next(err); }
}

export async function removeComment(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteComment(req.params.commentId, req.user!.id));
  } catch (err) { next(err); }
}

export async function logTime(req: Request, res: Response, next: NextFunction) {
  try {
    const input = timeEntrySchema.parse(req.body);
    res.status(201).json(await svc.addTimeEntry(req.params.taskId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function removeTimeEntry(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteTimeEntry(req.params.entryId, req.user!.id));
  } catch (err) { next(err); }
}
