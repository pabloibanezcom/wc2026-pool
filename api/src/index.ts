import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { startSyncJobs } from './jobs/syncResults';
import authRoutes from './routes/auth';
import matchRoutes from './routes/matches';
import predictionRoutes from './routes/predictions';
import leagueRoutes from './routes/leagues';
import adminRoutes from './routes/admin';

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/matches', matchRoutes);
app.use('/predictions', predictionRoutes);
app.use('/leagues', leagueRoutes);
app.use('/admin', adminRoutes);

// Error handler
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();
  if (env.FOOTBALL_DATA_API_KEY) {
    startSyncJobs();
  } else {
    logger.info('No FOOTBALL_DATA_API_KEY — skipping sync jobs');

    if (env.USE_IN_MEMORY_DB || env.SEED_DEV_DATA) {
      const { seedDevMatches } = await import('./jobs/seedDev');
      await seedDevMatches();
    } else {
      logger.info('Skipping dev data seeding');
    }
  }

  app.listen(Number(env.PORT), () => {
    logger.info(`API server running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
