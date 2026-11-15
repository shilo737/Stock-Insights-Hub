import 'reflect-metadata';
import { config } from './config';
import { AppDataSource } from './data-source';
import { createApp } from './app';
import { startMarketSimulation } from './services/market';

async function main() {
  await AppDataSource.initialize();
  console.log('Database connected');

  startMarketSimulation();
  console.log(`Market simulation running (tick ${config.marketTickMs}ms)`);

  createApp().listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
