import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

// /api/workspaces/:workspaceSlug/projects
router.get('/', ctrl.list);
router.get('/archived', ctrl.listArchived);
router.post('/', ctrl.create);
router.get('/:projectId', ctrl.getOne);
router.patch('/:projectId', ctrl.update);
router.post('/:projectId/archive', ctrl.archive);
router.post('/:projectId/unarchive', ctrl.unarchive);
router.post('/:projectId/invite', ctrl.invite);
router.get('/:projectId/invites', ctrl.listInvites);
router.delete('/:projectId/members/:memberId', ctrl.removeMember);
router.patch('/:projectId/members/:memberId', ctrl.updateMemberRole);

// Accept project invite
router.post('/invites/:token/accept', ctrl.acceptInvite);

export default router;
