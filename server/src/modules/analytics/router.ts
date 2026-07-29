import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getTeamReport, getTeamReportCsv } from './service';

// /api/workspaces/:slug/analytics
const router = Router({ mergeParams: true });

router.use(authenticate);

function parseDays(raw: unknown): number {
  const n = Number(raw);
  return [7, 30, 90].includes(n) ? n : 30;
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await getTeamReport((req.params as { slug: string }).slug, req.user!.id, parseDays(req.query.days)));
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const csv = await getTeamReportCsv((req.params as { slug: string }).slug, req.user!.id, parseDays(req.query.days));
    res.attachment(`${(req.params as { slug: string }).slug}-team-report.csv`);
    res.type('text/csv').send(csv);
  } catch (err) { next(err); }
});

export default router;
