import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });
router.use(authenticate);

// /api/lists/:listId/tasks
router.post('/', ctrl.create);

// /api/tasks/:taskId
router.get('/:taskId', ctrl.getOne);
router.patch('/:taskId', ctrl.update);
router.post('/:taskId/move', ctrl.move);
router.delete('/:taskId', ctrl.remove);
router.post('/:taskId/comments', ctrl.comment);

export default router;
