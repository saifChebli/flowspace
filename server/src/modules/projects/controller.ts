import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { createProjectSchema, updateProjectSchema, inviteProjectMemberSchema } from './schema';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProjectSchema.parse(req.body);
    const result = await svc.createProject(req.params.workspaceSlug, req.user!.id, input);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getProjects(req.params.workspaceSlug, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getProject(req.params.projectId, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateProjectSchema.parse(req.body);
    const result = await svc.updateProject(req.params.projectId, req.user!.id, input);
    res.json(result);
  } catch (err) { next(err); }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.archiveProject(req.params.projectId, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inviteProjectMemberSchema.parse(req.body);
    const result = await svc.inviteProjectMember(req.params.projectId, req.user!.id, input);
    res.json(result);
  } catch (err) { next(err); }
}

export async function acceptInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.acceptProjectInvite(req.params.token, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}
