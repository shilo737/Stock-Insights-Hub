import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import {
  MOCK_STATE,
  Poll,
  addTicker,
  cryptoId,
  deleteTicker,
  listTickers,
  serializePoll,
  updateTickerBase,
} from '../services/market';

const router = Router();
router.use(requireAuth, requireAdmin);

const symbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9^.\-]{1,12}$/, 'סימול לא תקין');

router.get('/tickers', (_req, res) => {
  res.json(listTickers());
});

router.post(
  '/tickers',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        symbol: symbolSchema,
        name: z.string().trim().min(1).max(60),
        basePrice: z.number().positive(),
        volatility: z.number().min(0).max(0.05).optional(),
      })
      .parse(req.body);
    try {
      res.status(201).json(addTicker(body.symbol, body.name, body.basePrice, body.volatility));
    } catch (e) {
      res.status(409).json({ error: (e as Error).message });
    }
  }),
);

router.patch(
  '/tickers/:symbol',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        basePrice: z.number().positive().optional(),
        name: z.string().trim().min(1).max(60).optional(),
        volatility: z.number().min(0).max(0.05).optional(),
      })
      .parse(req.body);
    const updated = updateTickerBase(req.params.symbol, body);
    if (!updated) return res.status(404).json({ error: 'הטיקר לא נמצא' });
    res.json(updated);
  }),
);

router.delete('/tickers/:symbol', (req, res) => {
  if (!deleteTicker(req.params.symbol)) {
    return res.status(404).json({ error: 'הטיקר לא נמצא' });
  }
  res.status(204).end();
});

router.get('/polls', (_req, res) => {
  res.json(MOCK_STATE.polls.map((p) => serializePoll(p)));
});

router.post(
  '/polls',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        question: z.string().trim().min(3).max(200),
        options: z.array(z.string().trim().min(1).max(80)).min(2).max(6),
      })
      .parse(req.body);

    // Only one active poll at a time
    for (const p of MOCK_STATE.polls) p.active = false;
    const poll: Poll = {
      id: cryptoId(),
      question: body.question,
      options: body.options.map((text, i) => ({ id: String(i + 1), text, votes: 0 })),
      active: true,
      createdAt: new Date().toISOString(),
      voters: new Set(),
    };
    MOCK_STATE.polls.unshift(poll);
    res.status(201).json(serializePoll(poll));
  }),
);

router.post('/polls/:id/close', (req, res) => {
  const poll = MOCK_STATE.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'הסקר לא נמצא' });
  poll.active = false;
  res.json(serializePoll(poll));
});

router.delete('/polls/:id', (req, res) => {
  const idx = MOCK_STATE.polls.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'הסקר לא נמצא' });
  MOCK_STATE.polls.splice(idx, 1);
  res.status(204).end();
});

router.get('/tip', (_req, res) => {
  res.json(MOCK_STATE.dailyTip);
});

router.put(
  '/tip',
  asyncHandler(async (req, res) => {
    const body = z.object({ text: z.string().trim().min(3).max(500) }).parse(req.body);
    MOCK_STATE.dailyTip = { text: body.text, updatedAt: new Date().toISOString() };
    res.json(MOCK_STATE.dailyTip);
  }),
);

export default router;
