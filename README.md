Stock Insights Hub — Project Overview
Stock Insights Hub is a modern, closed-community social web platform designed for peers and traders to share financial insights, stock market analysis, market news, and trading education. Built with a sleek, professional Dark Mode UI reminiscent of a real trading terminal, the platform operates seamlessly even in isolated network environments.

 Key Features & Capabilities
Multi-Tab Feed Architecture:

Market News: Macro updates, general news, and market overviews.

 Stock Insights: The core social feed dedicated to specific stock analyses (e.g., $AAPL, $NVDA) with sentiment tagging (BULLISH, BEARISH, NEUTRAL).

 Learning: Educational posts covering trading strategies, technical analysis, and investment psychology.

Offline Mock Market & Dynamic Ticker Tape:

Features a built-in mock data provider with a Random Walk algorithm that dynamically simulates real-time price fluctuations.

Powers a live top-bar Ticker Tape and mini Sparkline charts for an authentic trading floor experience without relying on external APIs.

Admin Control Panel:

A dedicated, role-protected interface allowing administrators (ADMIN) to manage tickers, base prices, daily community polls, and investment pro-tips in real-time without restarting the server.

Interactive Community Widgets:

Includes a live daily quick poll, featured investment pro-tips, and community engagement features like likes and comments.

Role-Based Access Control (RBAC):

Secure role management separating standard users (USER) from administrators (ADMIN), with backend middleware guarding sensitive routes.

🛠️ Tech Stack
Frontend:

React (Vite) with TypeScript

Tailwind CSS (Optimized Dark Mode UI)

TanStack Query (React Query) for efficient client-side caching, 0ms tab switching, and background prefetching

Lucide React (Icons), React Router

Backend:

Node.js, Express.js with TypeScript

JWT Authentication & Bcrypt password hashing

Database & ORM:

PostgreSQL (hosted on Neon) managed via TypeORM

Optimized with composite database indexes for high-performance sorting and filtering

/////////////////////////////////////////////////////////////////////////////////////////////

stock-insights-hub/
├── backend/    Node.js + Express + TypeScript + TypeORM (PostgreSQL)
└── frontend/   React + Vite + TypeScript + Tailwind (dark) + TanStack Query
Quick start
Create a PostgreSQL database: createdb stock_insights
Backend
cd backend
cp .env.example .env     # set DB credentials and JWT_SECRET
npm install
npm run seed             # admin user + sample posts
npm run dev              # :4000
Frontend (new terminal)
cd frontend
npm install
npm run dev              # :5173
Default admin: admin@example.com / Admin1234! (see backend/.env.example) – change before real use.

No external APIs are called at runtime, so everything works on an isolated network (after npm install has been done once).