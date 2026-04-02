import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router();
router.use(authenticate);

// /api/notifications
router.get('/', ctrl.list);
router.patch('/:id/read', ctrl.markRead);
router.post('/read-all', ctrl.markAllRead);

export default router;
