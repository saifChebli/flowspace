import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePlatformAdmin } from '../../middleware/platformAdmin';
import * as ctrl from './controller';

const router = Router();

router.use(authenticate, requirePlatformAdmin);

router.get('/stats', ctrl.getStats);
router.get('/workspaces', ctrl.listWorkspaces);
router.get('/workspaces/:id', ctrl.getWorkspace);
router.delete('/workspaces/:id', ctrl.deleteWorkspace);
router.post('/workspaces/:id/plan', ctrl.setWorkspacePlan);
router.get('/users', ctrl.listUsers);
router.post('/users/:id/suspend', ctrl.suspendUser);
router.post('/users/:id/unsuspend', ctrl.unsuspendUser);
router.delete('/invites/:id', ctrl.revokeInvite);

export default router;
