import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { createBoardSchema, updateBoardSchema, createListSchema, updateListSchema } from './schema';

export async function createBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createBoardSchema.parse(req.body);
    res.status(201).json(await svc.createBoard(req.params.projectId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function listBoards(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getBoards(req.params.projectId, req.user!.id));
  } catch (err) { next(err); }
}

export async function updateBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateBoardSchema.parse(req.body);
    res.json(await svc.updateBoard(req.params.boardId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function deleteBoard(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteBoard(req.params.boardId, req.user!.id));
  } catch (err) { next(err); }
}

export async function createList(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createListSchema.parse(req.body);
    res.status(201).json(await svc.createList(req.params.boardId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function updateList(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateListSchema.parse(req.body);
    res.json(await svc.updateList(req.params.listId, req.user!.id, input));
  } catch (err) { next(err); }
}

export async function deleteList(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deleteList(req.params.listId, req.user!.id));
  } catch (err) { next(err); }
}
