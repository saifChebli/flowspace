import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });
router.use(authenticate);

// /api/projects/:projectId/channels
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:channelId', ctrl.update);
router.delete('/:channelId', ctrl.remove);

export default router;
