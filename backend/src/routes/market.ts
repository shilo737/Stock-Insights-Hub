import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { getActivePoll, listTickers, serializePoll } from '../services/market';

const router = Router();

/** Feeds the ticker tape + sparklines. Cheap (in-memory), safe to poll. */
router.get('/tickers', (_req, res) => {
  res.json(listTickers());
});

const voteSchema = z.object({ optionId: z.string().min(1) });

router.post(
  '/poll/:id/vote',
  requireAuth,
  asyncHandler(async (req, res) => {
    const poll = getActivePoll();
    if (!poll || poll.id !== req.params.id) {
      return res.status(404).json({ error: 'הסקר לא נמצא או נסגר' });
    }
    const { optionId } = voteSchema.parse(req.body);
    const userId = req.auth!.sub;
    if (poll.voters.has(userId)) {
      return res.status(409).json({ error: 'כבר הצבעת בסקר הזה' });
    }
    const opt = poll.options.find((o) => o.id === optionId);
    if (!opt) return res.status(400).json({ error: 'אפשרות לא תקינה' });
    opt.votes += 1;
    poll.voters.add(userId);
    res.json(serializePoll(poll, userId));
  }),
);

export default router;
