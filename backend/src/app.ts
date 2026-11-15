import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import dashboardRoutes from './routes/dashboard';
import marketRoutes from './routes/market';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/error';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/admin', adminRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'הנתיב לא נמצא' }));
  app.use(errorHandler);
  return app;
}
