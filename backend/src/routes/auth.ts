import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { requireAuth, signToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3, 'שם משתמש קצר מדי (לפחות 3 תווים)').max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'אותיות באנגלית, מספרים ו- _ . - בלבד'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים').max(100),
});

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1),
});

function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  };
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const repo = AppDataSource.getRepository(User);
    const email = body.email.toLowerCase();

    const exists = await repo.findOne({
      where: [{ email }, { username: body.username }],
    });
    if (exists) {
      return res.status(409).json({ error: 'שם המשתמש או האימייל כבר תפוסים' });
    }

    const user = repo.create({
      username: body.username,
      email,
      password: await bcrypt.hash(body.password, 10),
      role: 'USER',
      avatarUrl: null,
    });
    await repo.save(user);

    const token = signToken({ sub: user.id, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email: body.email.toLowerCase() },
    });
    const ok = user && (await bcrypt.compare(body.password, user.password));
    if (!user || !ok) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }
    const token = signToken({ sub: user.id, role: user.role });
    res.json({ token, user: publicUser(user) });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.auth!.sub },
    });
    if (!user) return res.status(401).json({ error: 'המשתמש אינו קיים עוד' });
    res.json({ user: publicUser(user) });
  }),
);

export default router;
