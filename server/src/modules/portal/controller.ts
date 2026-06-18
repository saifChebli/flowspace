import { Request, Response, NextFunction } from 'express';
import * as svc from './service';

// POST /api/portal/:portalToken/magic-link  (public)
export async function requestMagicLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }
    res.json(await svc.requestMagicLink(req.params.portalToken, email));
  } catch (err) { next(err); }
}

// POST /api/portal/invite/:inviteToken/accept  (public — zero-friction client onboarding)
export async function acceptClientInvite(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.acceptClientInvite(req.params.inviteToken));
  } catch (err) { next(err); }
}

// POST /api/portal/set-password  (portal-authenticated)
export async function setPortalPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }
    res.json(await svc.setPortalPassword(req.portalUser!.userId, password));
  } catch (err) { next(err); }
}

// GET /api/portal/session/:sessionToken  (public)
export async function validateSession(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.validateSession(req.params.sessionToken));
  } catch (err) { next(err); }
}

// GET /api/portal/:portalToken  (public — landing page info)
export async function getPortalProject(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getPortalProject(req.params.portalToken));
  } catch (err) { next(err); }
}

// POST /api/portal/token/generate  (team-member, authenticated)
export async function generateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.body;
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }
    res.json(await svc.generatePortalToken(projectId, req.user!.id));
  } catch (err) { next(err); }
}

// DELETE /api/portal/token/revoke  (team-member, authenticated)
export async function revokeToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.body;
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }
    res.json(await svc.revokePortalToken(projectId, req.user!.id));
  } catch (err) { next(err); }
}

// GET /api/portal/projects  (portal-authenticated)
export async function getClientProjects(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.getClientProjects(req.portalUser!.userId));
  } catch (err) { next(err); }
}
