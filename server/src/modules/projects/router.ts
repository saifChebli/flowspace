import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

// /api/workspaces/:workspaceSlug/projects
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:projectId', ctrl.getOne);
router.patch('/:projectId', ctrl.update);
router.post('/:projectId/archive', ctrl.archive);
router.post('/:projectId/invite', ctrl.invite);

// Accept project invite
router.post('/invites/:token/accept', ctrl.acceptInvite);

export default router;
