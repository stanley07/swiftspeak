import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';
import { nanoid } from 'nanoid';

const router: ExpressRouter = Router();

router.post('/', async (req: Request, res: Response) => {
  const { itemId, mode = 'read', answerText = '', lang = 'en' } =
    (req.body ?? {}) as { itemId?: string; mode?: 'read'|'listen'|'speak'; answerText?: string; lang?: 'en'|'yo'|'ig'|'ha' };

  if (!itemId) return res.status(400).json({ error: 'itemId is required' });

  const score = answerText ? Math.min(1, answerText.trim().length / 20) : 0;
  res.json({
    id: nanoid(),
    score,
    hint: score < 0.6 ? 'Slow down and stress vowels.' : 'Good articulation—keep pace steady.'
  });
});

export default router;
