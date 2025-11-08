import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';

const router: ExpressRouter = Router();

router.get('/summary', (_req: Request, res: Response) => {
  res.json({
    wpm: 120,
    accuracy: 85,
    retention24h: 0,
    retention7d: 0,
    masteredToday: 0,
    avgLatencyMs: 900
  });
});

export default router;
