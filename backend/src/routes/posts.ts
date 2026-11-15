import { Router } from 'express';
import { In } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../data-source';
import { Post } from '../entities/Post';
import { Comment } from '../entities/Comment';
import { Like } from '../entities/Like';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { invalidateSidebarCache } from './dashboard';

const router = Router();

const categoryEnum = z.enum(['news', 'insight', 'learning']);
const sentimentEnum = z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']);

const tickerSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/^\$/, '').toUpperCase())
  .refine((s) => /^[A-Z0-9^.\-]{1,12}$/.test(s), 'סימול מניה לא תקין');

const createSchema = z
  .object({
    title: z.string().trim().min(3, 'הכותרת קצרה מדי').max(200),
    content: z.string().trim().min(1, 'חובה למלא תוכן').max(20000),
    category: categoryEnum.default('insight'),
    ticker: tickerSchema.optional().nullable().or(z.literal('').transform(() => null)),
    sentiment: sentimentEnum.optional().nullable(),
  })
  .refine((d) => d.category !== 'insight' || !!d.ticker, {
    message: 'חובה לציין סימול מניה בפוסט תובנה',
    path: ['ticker'],
  });

const updateSchema = z.object({
  title: z.string().trim().min(3, 'הכותרת קצרה מדי').max(200).optional(),
  content: z.string().trim().min(1, 'חובה למלא תוכן').max(20000).optional(),
  category: categoryEnum.optional(),
  ticker: tickerSchema.optional().nullable().or(z.literal('').transform(() => null)),
  sentiment: sentimentEnum.optional().nullable(),
});

const listSchema = z.object({
  category: categoryEnum.optional(),
  ticker: tickerSchema.optional(),
  sentiment: sentimentEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, 'התגובה ריקה').max(2000),
  parentId: z.string().uuid().optional().nullable(),
});

function serializeComment(c: Comment) {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    parentId: c.parentId,
    author: { id: c.author.id, username: c.author.username, avatarUrl: c.author.avatarUrl },
    replyToUser: c.replyToUser
      ? { id: c.replyToUser.id, username: c.replyToUser.username }
      : null,
  };
}

async function serializePosts(posts: Post[], viewerId?: string) {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);

  const likeRows = await AppDataSource.getRepository(Like)
    .createQueryBuilder('l')
    .select('l.postId', 'postId')
    .addSelect('COUNT(*)', 'count')
    .where('l.postId IN (:...ids)', { ids })
    .groupBy('l.postId')
    .getRawMany<{ postId: string; count: string }>();

  const commentRows = await AppDataSource.getRepository(Comment)
    .createQueryBuilder('c')
    .select('c.postId', 'postId')
    .addSelect('COUNT(*)', 'count')
    .where('c.postId IN (:...ids)', { ids })
    .groupBy('c.postId')
    .getRawMany<{ postId: string; count: string }>();

  const mine = viewerId
    ? await AppDataSource.getRepository(Like).find({
        where: { userId: viewerId, postId: In(ids) },
        select: { postId: true },
      })
    : [];

  const likeMap = new Map(likeRows.map((r) => [r.postId, Number(r.count)]));
  const commentMap = new Map(commentRows.map((r) => [r.postId, Number(r.count)]));
  const mineSet = new Set(mine.map((m) => m.postId));

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category,
    ticker: p.ticker,
    sentiment: p.sentiment,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    author: {
      id: p.author.id,
      username: p.author.username,
      avatarUrl: p.author.avatarUrl,
      role: p.author.role,
    },
    likeCount: likeMap.get(p.id) ?? 0,
    commentCount: commentMap.get(p.id) ?? 0,
    likedByMe: mineSet.has(p.id),
  }));
}

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = listSchema.parse(req.query);
    const where: Record<string, unknown> = {};
    if (q.category) where.category = q.category;
    if (q.ticker) where.ticker = q.ticker;
    if (q.sentiment) where.sentiment = q.sentiment;

    const [posts, total] = await AppDataSource.getRepository(Post).findAndCount({
      where,
      relations: { author: true },
      order: { createdAt: 'DESC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });

    res.json({
      items: await serializePosts(posts, req.auth?.sub),
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    });
  }),
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const repo = AppDataSource.getRepository(Post);
    const post = repo.create({
      title: body.title,
      content: body.content,
      category: body.category,
      ticker: body.ticker ?? null,
      sentiment: body.sentiment ?? null,
      authorId: req.auth!.sub,
    });
    await repo.save(post);
    const full = await repo.findOneOrFail({
      where: { id: post.id },
      relations: { author: true },
    });
    invalidateSidebarCache();
    const [out] = await serializePosts([full], req.auth!.sub);
    res.status(201).json(out);
  }),
);

router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Post);
    const post = await repo.findOne({
      where: { id: req.params.id },
      relations: { author: true },
    });
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });
    if (post.authorId !== req.auth!.sub && req.auth!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'אין לך הרשאה לפעולה זו' });
    }

    const body = updateSchema.parse(req.body);
    if (body.title !== undefined) post.title = body.title;
    if (body.content !== undefined) post.content = body.content;
    if (body.category !== undefined) post.category = body.category;
    if (body.ticker !== undefined) post.ticker = body.ticker ?? null;
    if (body.sentiment !== undefined) post.sentiment = body.sentiment ?? null;
    if (post.category === 'insight' && !post.ticker) {
      return res.status(400).json({ error: 'חובה לציין סימול מניה בפוסט תובנה' });
    }
    await repo.save(post);
    invalidateSidebarCache();
    const [out] = await serializePosts([post], req.auth!.sub);
    res.json(out);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Post);
    const post = await repo.findOne({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });
    if (post.authorId !== req.auth!.sub && req.auth!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'אין לך הרשאה לפעולה זו' });
    }
    await repo.delete(post.id);
    invalidateSidebarCache();
    res.status(204).end();
  }),
);

router.post(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await AppDataSource.getRepository(Post).findOne({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });

    const likes = AppDataSource.getRepository(Like);
    const existing = await likes.findOne({
      where: { postId: post.id, userId: req.auth!.sub },
    });
    if (existing) await likes.delete(existing.id);
    else await likes.save(likes.create({ postId: post.id, userId: req.auth!.sub }));

    const likeCount = await likes.count({ where: { postId: post.id } });
    res.json({ liked: !existing, likeCount });
  }),
);

router.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const comments = await AppDataSource.getRepository(Comment).find({
      where: { postId: req.params.id },
      relations: { author: true, replyToUser: true },
      order: { createdAt: 'ASC' },
    });
    res.json(comments.map(serializeComment));
  }),
);

router.post(
  '/:id/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await AppDataSource.getRepository(Post).findOne({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });

    const body = commentSchema.parse(req.body);
    const repo = AppDataSource.getRepository(Comment);

    // Threading: two levels (root comment + replies). A reply to a reply is
    // attached to the same root, and tags the person being answered.
    let parentId: string | null = null;
    let replyToUserId: string | null = null;
    if (body.parentId) {
      const parent = await repo.findOne({ where: { id: body.parentId, postId: post.id } });
      if (!parent) return res.status(400).json({ error: 'תגובת האב לא נמצאה' });
      parentId = parent.parentId ?? parent.id;
      replyToUserId = parent.authorId;
    }

    const saved = await repo.save(
      repo.create({
        postId: post.id,
        authorId: req.auth!.sub,
        content: body.content,
        parentId,
        replyToUserId,
      }),
    );
    const full = await repo.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true, replyToUser: true },
    });
    res.status(201).json(serializeComment(full));
  }),
);

router.delete(
  '/:id/comments/:commentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Comment);
    const c = await repo.findOne({ where: { id: req.params.commentId, postId: req.params.id } });
    if (!c) return res.status(404).json({ error: 'התגובה לא נמצאה' });
    if (c.authorId !== req.auth!.sub && req.auth!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'אין לך הרשאה לפעולה זו' });
    }
    await repo.delete(c.id); // replies are removed via ON DELETE CASCADE
    res.status(204).end();
  }),
);

export default router;
