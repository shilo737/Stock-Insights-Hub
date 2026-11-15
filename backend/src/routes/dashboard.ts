import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Post } from '../entities/Post';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { MOCK_STATE, getActivePoll, serializePoll } from '../services/market';

const router = Router();

// ---- Server-side cache for the "hot stocks" aggregation (the DB-backed part) ----
const HOT_TTL_MS = 30_000;
let hotCache: { at: number; data: Array<{ ticker: string; mentions: number }> } | null = null;

export function invalidateSidebarCache() {
  hotCache = null;
  leaderCache = null;
}

// ---- Top contributors (most posts in the last day / week) ----
interface Leader {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  posts: number;
}
const LEADER_TTL_MS = 60_000;
let leaderCache: { at: number; data: { day: Leader[]; week: Leader[] } } | null = null;

async function topContributors(hours: number): Promise<Leader[]> {
  const since = new Date(Date.now() - hours * 3600 * 1000);
  const rows = await AppDataSource.getRepository(Post)
    .createQueryBuilder('p')
    .innerJoin('p.author', 'u')
    .select('u.id', 'userId')
    .addSelect('u.username', 'username')
    .addSelect('u.avatarUrl', 'avatarUrl')
    .addSelect('u.role', 'role')
    .addSelect('COUNT(p.id)', 'posts')
    .where('p.createdAt > :since', { since })
    .groupBy('u.id')
    .addGroupBy('u.username')
    .addGroupBy('u.avatarUrl')
    .addGroupBy('u.role')
    .orderBy('posts', 'DESC')
    .addOrderBy('u.username', 'ASC')
    .limit(5)
    .getRawMany<{
      userId: string;
      username: string;
      avatarUrl: string | null;
      role: 'USER' | 'ADMIN';
      posts: string;
    }>();
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    username: r.username,
    avatarUrl: r.avatarUrl,
    role: r.role,
    posts: Number(r.posts),
  }));
}

async function getLeaders() {
  if (leaderCache && Date.now() - leaderCache.at < LEADER_TTL_MS) return leaderCache.data;
  const [day, week] = await Promise.all([topContributors(24), topContributors(24 * 7)]);
  leaderCache = { at: Date.now(), data: { day, week } };
  return leaderCache.data;
}

async function getHotMentions() {
  if (hotCache && Date.now() - hotCache.at < HOT_TTL_MS) return hotCache.data;
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const rows = await AppDataSource.getRepository(Post)
    .createQueryBuilder('p')
    .select('p.ticker', 'ticker')
    .addSelect('COUNT(*)', 'mentions')
    .where('p.ticker IS NOT NULL')
    .andWhere('p.createdAt > :since', { since })
    .groupBy('p.ticker')
    .orderBy('mentions', 'DESC')
    .limit(5)
    .getRawMany<{ ticker: string; mentions: string }>();
  const data = rows.map((r) => ({ ticker: r.ticker, mentions: Number(r.mentions) }));
  hotCache = { at: Date.now(), data };
  return data;
}

/** Unified sidebar endpoint: hot stocks + active poll + daily tip. */
router.get(
  '/sidebar',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const mentions = await getHotMentions();
    let hotStocks = mentions.map((m) => {
      const t = MOCK_STATE.tickers.get(m.ticker);
      return {
        ticker: m.ticker,
        mentions: m.mentions,
        price: t?.price ?? null,
        changePct: t?.changePct ?? null,
        sparkline: t?.history ?? [],
      };
    });

    // Fallback: if the community has not posted yet, show top movers instead.
    if (hotStocks.length === 0) {
      hotStocks = [...MOCK_STATE.tickers.values()]
        .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, 5)
        .map((t) => ({
          ticker: t.symbol,
          mentions: 0,
          price: t.price,
          changePct: t.changePct,
          sparkline: t.history,
        }));
    }

    const poll = getActivePoll();
    res.json({
      hotStocks,
      poll: poll ? serializePoll(poll, req.auth?.sub) : null,
      dailyTip: MOCK_STATE.dailyTip,
      topContributors: await getLeaders(),
    });
  }),
);

export default router;
