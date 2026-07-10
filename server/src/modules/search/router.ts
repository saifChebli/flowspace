import { Router } from 'express';
import { authenticateAny } from '../../middleware/portalAuth';
import * as ctrl from './controller';

// /api/projects/:projectId/search
const router = Router({ mergeParams: true });

router.get('/', authenticateAny, ctrl.search);

export default router;
