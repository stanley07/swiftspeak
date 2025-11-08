import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';

const router: ExpressRouter = Router();

router.get('/next', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const limit = Number((req.query.limit as string) ?? 10);
  res.json({
    items: [
      { id: `${lang}_1`, text_native: 'Sample phrase', gloss_en: 'Sample gloss' }
    ].slice(0, limit)
  });
});

router.post('/grade', (_req: Request, res: Response) => {
  const due = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
  res.json({ nextDueAt: due });
});

export default router;
