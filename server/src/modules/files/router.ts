import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });
router.use(authenticate);

// /api/projects/:projectId/files
router.get('/', ctrl.list);
router.post('/presign', ctrl.presign);
router.post('/confirm', ctrl.confirm);
router.get('/:fileId/download', ctrl.download);
router.delete('/:fileId', ctrl.remove);

export default router;
