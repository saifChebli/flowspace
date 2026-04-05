import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });
router.use(authenticate);

// /api/projects/:projectId/boards
router.get('/', ctrl.listBoards);
router.post('/', ctrl.createBoard);

// /api/boards/:boardId
router.patch('/:boardId', ctrl.updateBoard);
router.delete('/:boardId', ctrl.deleteBoard);

// /api/boards/:boardId/lists
router.post('/:boardId/lists', ctrl.createList);
router.patch('/lists/:listId', ctrl.updateList);
router.delete('/lists/:listId', ctrl.deleteList);

export default router;
