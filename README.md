# Stock Insights Hub

```
stock-insights-hub/
├── backend/    Node.js + Express + TypeScript + TypeORM (PostgreSQL)
└── frontend/   React + Vite + TypeScript + Tailwind (dark) + TanStack Query
```

## Quick start

1. Create a PostgreSQL database: `createdb stock_insights`
2. Backend
   ```bash
   cd backend
   cp .env.example .env     # set DB credentials and JWT_SECRET
   npm install
   npm run seed             # admin user + sample posts
   npm run dev              # :4000
   ```
3. Frontend (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev              # :5173
   ```

Default admin: `admin@example.com` / `Admin1234!` (see `backend/.env.example`) – change before real use.

No external APIs are called at runtime, so everything works on an isolated network
(after `npm install` has been done once).

## מה חדש בגרסה זו

- ממשק בעברית מלאה (RTL), כולל הודעות שגיאה מהשרת.
- תגובות לתגובות: כפתור "השב" מתייג את הכותב המקורי (`replyToUser`). תגובה על תגובה-בת מצורפת לשרשור הראשי ומתייגת את מי שענו לו (שרשור בשתי רמות).
- תיוג חופשי בטקסט: `@שם_משתמש` ו-`$AAPL` מודגשים (`$AAPL` גם מקשר לפיד של המניה). אין כרגע התראות למתויגים.
- "מובילי הקהילה" מתחת לטיפ היומי: טופ 5 כותבים ביום / בשבוע, ותגית 🏆 ליד שם הטופ 3 השבועי בפוסטים ובתגובות.
- כל עמודות ה-TypeORM מוגדרות עם טיפוס מפורש (`{ type: 'uuid' | 'varchar' | 'text' | ... }`) כדי למנוע `ColumnTypeUndefinedError` תחת `tsx`.

> אם יש לך DB קיים מהגרסה הקודמת: נוספו עמודות `parentId` ו-`replyToUserId` בטבלת `comments`.
> `synchronize: true` ימזג אותן אוטומטית; לפיתוח אפשר גם למחוק את ה-DB וליצור מחדש.
