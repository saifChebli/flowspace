import { Router } from 'express';
import { getPublicStats } from './service';

// /api/public — unauthenticated marketing data
const router = Router();

router.get('/stats', async (_req, res, next) => {
  try {
    res.json(await getPublicStats());
  } catch (err) { next(err); }
});

export default router;
