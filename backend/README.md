# Stock Insights Hub – Backend

Node.js + Express + TypeScript + TypeORM (PostgreSQL).

## Setup

```bash
cp .env.example .env      # edit DB credentials + JWT_SECRET
npm install
npm run seed              # creates admin user + sample posts
npm run dev               # http://localhost:4000
```

The database (`DB_NAME`) must already exist: `createdb stock_insights`.
Tables are created automatically (`synchronize: true`) – fine for this
boutique-scale app; switch to migrations if you need stricter control.

Default admin (from `.env`): `admin@example.com` / `Admin1234!` – change it.

## Production

```bash
npm run build && npm start
```

## API summary

| Method | Path | Auth |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | – |
| GET | /api/auth/me | user |
| GET | /api/posts?category=&ticker=&sentiment=&page=&limit= | optional |
| POST | /api/posts | user |
| PATCH/DELETE | /api/posts/:id | author or ADMIN |
| POST | /api/posts/:id/like (toggle) | user |
| GET/POST | /api/posts/:id/comments | GET public / POST user |
| GET | /api/dashboard/sidebar | optional |
| GET | /api/market/tickers | – |
| POST | /api/market/poll/:id/vote | user |
| * | /api/admin/tickers, /polls, /tip | ADMIN |

## Notes

- Market data lives in memory (`MOCK_STATE`, `src/services/market.ts`) and is
  driven by a random walk with mild mean reversion. Admin changes apply live,
  but reset on server restart (polls, tip and tickers are not persisted).
- Sidebar "hot stocks" aggregation is cached server-side for 30s and
  invalidated whenever a post is created/edited/deleted.
