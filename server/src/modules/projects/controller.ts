import { Request, Response, NextFunction } from 'express';
import * as svc from './service';
import { createProjectSchema, updateProjectSchema, inviteProjectMemberSchema, updateProjectMemberRoleSchema } from './schema';
import { templateList } from './templates';
import { importTrelloCsv } from '../import/service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProjectSchema.parse(req.body);
    const result = await svc.createProject(req.params.workspaceSlug, req.user!.id, input);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export function listTemplates(_req: Request, res: Response) {
  res.json(templateList);
}

export async function importTrello(req: Request, res: Response, next: NextFunction) {
  try {
    const { csv, boardName } = req.body ?? {};
    if (typeof csv !== 'string' || csv.trim().length === 0) {
      return res.status(400).json({ error: 'csv content is required' });
    }
    if (csv.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'That file is too large (5 MB max).' });
    }
    res.json(await importTrelloCsv(req.params.projectId, req.user!.id, csv, boardName));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getProjects(req.params.workspaceSlug, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function listArchived(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getArchivedProjects(req.params.workspaceSlug, req.user!.id);
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

export async function unarchive(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.unarchiveProject(req.params.projectId, req.user!.id);
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

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.removeProjectMember(req.params.projectId, req.user!.id, req.params.memberId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateProjectMemberRoleSchema.parse(req.body);
    const result = await svc.updateProjectMemberRole(req.params.projectId, req.user!.id, req.params.memberId, input);
    res.json(result);
  } catch (err) { next(err); }
}

export async function listInvites(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getPendingProjectInvites(req.params.projectId, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}
