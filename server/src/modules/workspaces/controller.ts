import { Request, Response, NextFunction } from 'express';
import * as workspaceService from './service';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './schema';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createWorkspaceSchema.parse(req.body);
    const result = await workspaceService.createWorkspace(req.user!.id, input);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.getWorkspaces(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.getWorkspace(req.params.slug, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateWorkspaceSchema.parse(req.body);
    const result = await workspaceService.updateWorkspace(req.params.slug, req.user!.id, input);
    res.json(result);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.deleteWorkspace(req.params.slug, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inviteMemberSchema.parse(req.body);
    const result = await workspaceService.inviteMember(req.params.slug, req.user!.id, input);
    res.json(result);
  } catch (err) { next(err); }
}

export async function acceptInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.acceptInvite(req.params.token, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.removeMember(
      req.params.slug,
      req.user!.id,
      req.params.memberId
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateMemberRoleSchema.parse(req.body);
    const result = await workspaceService.updateMemberRole(
      req.params.slug,
      req.user!.id,
      req.params.memberId,
      input
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function listInvites(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.getPendingInvites(req.params.slug, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}
