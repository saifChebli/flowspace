import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authenticatePortal } from '../../middleware/portalAuth';
import * as ctrl from './controller';

const router = Router();

// ── Team-member routes (JWT auth) — must be before /:portalToken wildcard ──
router.post('/token/generate', authenticate, ctrl.generateToken);
router.delete('/token/revoke', authenticate, ctrl.revokeToken);

// ── Portal-authenticated routes ────────────────────────────────────────────
router.get('/client/projects', authenticatePortal, ctrl.getClientProjects);
router.post('/set-password', authenticatePortal, ctrl.setPortalPassword);

// ── Public routes — specific paths before wildcard ─────────────────────────
router.post('/invite/:inviteToken/accept', ctrl.acceptClientInvite);
router.get('/session/:sessionToken', ctrl.validateSession);
router.get('/:portalToken', ctrl.getPortalProject);
router.post('/:portalToken/magic-link', ctrl.requestMagicLink);

export default router;
