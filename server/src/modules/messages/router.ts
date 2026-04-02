import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });
router.use(authenticate);

// /api/channels/:channelId/messages
router.get('/', ctrl.list);
router.post('/', ctrl.send);
router.patch('/:messageId', ctrl.edit);
router.delete('/:messageId', ctrl.remove);

export default router;
