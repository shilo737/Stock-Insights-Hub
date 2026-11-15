import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { User } from './entities/User';
import { Post } from './entities/Post';

async function main() {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(User);
  const posts = AppDataSource.getRepository(Post);

  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  let admin = await users.findOne({ where: { email } });
  if (!admin) {
    admin = await users.save(
      users.create({
        username: process.env.ADMIN_USERNAME ?? 'admin',
        email,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin1234!', 10),
        role: 'ADMIN',
        avatarUrl: null,
      }),
    );
    console.log(`✔ Admin created: ${email}`);
  } else {
    if (admin.role !== 'ADMIN') {
      admin.role = 'ADMIN';
      await users.save(admin);
    }
    console.log(`• Admin already exists: ${email}`);
  }

  if ((await posts.count()) === 0) {
    await posts.save([
      posts.create({
        title: 'ברוכים הבאים ל-Stock Insights Hub',
        content:
          'כאן משתפים חדשות שוק, ניתוחי מניות וחומרי למידה עם הקבוצה. הירשמו כדי להתחיל לפרסם.',
        category: 'news',
        ticker: null,
        sentiment: 'NEUTRAL',
        authorId: admin.id,
      }),
      posts.create({
        title: 'NVDA: המומנטום עדיין חזק',
        content:
          'הביקוש למרכזי נתונים ממשיך להעלות הערכות. הממוצע ל-20 יום משמש תמיכה; שבירה מטה תשנה את הגישה שלי.',
        category: 'insight',
        ticker: 'NVDA',
        sentiment: 'BULLISH',
        authorId: admin.id,
      }),
      posts.create({
        title: 'TSLA: מתוחה אחרי העלייה',
        content:
          'הערכת השווי לא משאירה מרווח לטעויות. אני מעדיף לחכות לתיקון ולא לרדוף אחרי המחיר.',
        category: 'insight',
        ticker: 'TSLA',
        sentiment: 'BEARISH',
        authorId: admin.id,
      }),
      posts.create({
        title: 'ניהול גודל פוזיציה - הבסיס',
        content:
          'מסכנים אחוז קטן וקבוע מההון בכל עסקה. קודם כל לשרוד, אחר כך לרווח.',
        category: 'learning',
        ticker: null,
        sentiment: null,
        authorId: admin.id,
      }),
    ]);
    console.log('✔ Sample posts created');
  }

  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
