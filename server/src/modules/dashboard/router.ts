import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authenticateAny } from '../../middleware/portalAuth';
import * as ctrl from './controller';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/dashboard
router.get('/', authenticate, ctrl.getDashboard);

// GET /api/projects/:projectId/dashboard/activity?cursor=&limit=
router.get('/activity', authenticate, ctrl.getActivity);

// GET /api/projects/:projectId/dashboard/client-portal
router.get('/client-portal', authenticateAny, ctrl.getClientPortal);

export default router;
