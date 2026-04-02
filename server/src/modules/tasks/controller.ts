import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { createTaskSchema, updateTaskSchema, moveTaskSchema, commentSchema } from './schema';

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
