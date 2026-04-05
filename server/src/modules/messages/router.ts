import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authenticateAny } from '../../middleware/portalAuth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });

// /api/channels/:channelId/messages
router.get('/', authenticateAny, ctrl.list);
router.post('/', authenticateAny, ctrl.send);
router.patch('/:messageId', authenticate, ctrl.edit);
router.delete('/:messageId', authenticate, ctrl.remove);
router.get('/:messageId/thread', authenticateAny, ctrl.listThread);

export default router;
