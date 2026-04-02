import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:slug', ctrl.getOne);
router.patch('/:slug', ctrl.update);
router.delete('/:slug', ctrl.remove);

router.post('/:slug/invite', ctrl.invite);
router.delete('/:slug/members/:memberId', ctrl.removeMember);

// Accept invite (token from email)
router.post('/invites/:token/accept', ctrl.acceptInvite);

export default router;
