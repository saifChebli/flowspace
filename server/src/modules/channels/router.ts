import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authenticateAny } from '../../middleware/portalAuth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });

// /api/projects/:projectId/channels
router.get('/', authenticateAny, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.patch('/:channelId', authenticate, ctrl.update);
router.delete('/:channelId', authenticate, ctrl.remove);
router.post('/:channelId/read', authenticateAny, ctrl.markRead);
router.post('/:channelId/join', authenticate, ctrl.join);
router.post('/:channelId/members', authenticate, ctrl.addMember);

export default router;
