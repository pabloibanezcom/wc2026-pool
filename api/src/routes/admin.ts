import { NextFunction, Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { syncAuthMiddleware } from '../middleware/syncAuth';
import { processFinishedMatches, syncAllFixtures } from '../services/syncService';

const router = Router();

const syncSchema = z.object({
  syncFixtures: z.boolean().default(true),
  processResults: z.boolean().default(true),
});

router.post('/sync', syncAuthMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { syncFixtures, processResults } = syncSchema.parse(req.body ?? {});

    if (!syncFixtures && !processResults) {
      res.status(400).json({ error: 'At least one sync action must be enabled' });
      return;
    }

    if (syncFixtures && !env.FOOTBALL_DATA_API_KEY) {
      res.status(503).json({ error: 'FOOTBALL_DATA_API_KEY is not configured on the server' });
      return;
    }

    logger.info({ syncFixtures, processResults }, 'Running manual sync');

    const fixtureResult = syncFixtures ? await syncAllFixtures() : { fixturesSynced: 0 };
    const scoringResult = processResults
      ? await processFinishedMatches()
      : { matchesProcessed: 0, predictionsScored: 0, leaguesUpdated: 0 };

    res.json({
      ok: true,
      syncFixtures,
      processResults,
      ...fixtureResult,
      ...scoringResult,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid sync payload', details: error.errors });
      return;
    }

    next(error);
  }
});

export default router;
