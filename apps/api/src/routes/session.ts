import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';
import { getItems } from '../services/itemsRepo';

const router: ExpressRouter = Router();

router.post('/start', (req: Request, res: Response) => {
  const { lang = 'en' } = (req.body ?? {}) as { lang?: 'en'|'yo'|'ig'|'ha' };
  const items = getItems(lang, 10);
  res.json({ sessionId: `sess_${Date.now()}`, items });
});

export default router;
