/**
 * Seeds mock betting odds onto all SCHEDULED/LIVE matches that don't yet have odds.
 * Generates realistic-looking decimal odds (European format) with a ~7% bookmaker margin.
 * Run with: npm run seed:odds
 */
import { connectDB } from '../config/db';
import { Match } from '../models/Match';
import { logger } from '../config/logger';

// Seeded pseudo-random — deterministic per match so re-runs produce the same odds
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Convert implied probability to decimal odds, then apply a bookmaker margin
function toOdds(probability: number, margin: number): number {
  const fair = 1 / probability;
  return Math.round((fair * (1 - margin)) * 100) / 100;
}

function generateOdds(seed: number): { home: number; draw: number; away: number } {
  const rand = seededRandom(seed);

  // Pick a random "balance" — how much the home team is favoured (0 = away favoured, 1 = home favoured)
  const balance = rand(); // 0..1

  let homeProb: number;
  let awayProb: number;

  if (balance < 0.2) {
    // Strong away favourite
    homeProb = 0.15 + rand() * 0.15; // 15–30%
    awayProb = 0.50 + rand() * 0.25; // 50–75%
  } else if (balance < 0.4) {
    // Slight away edge
    homeProb = 0.25 + rand() * 0.10; // 25–35%
    awayProb = 0.38 + rand() * 0.12; // 38–50%
  } else if (balance < 0.6) {
    // Even match
    homeProb = 0.30 + rand() * 0.10; // 30–40%
    awayProb = 0.28 + rand() * 0.10; // 28–38%
  } else if (balance < 0.8) {
    // Slight home edge
    homeProb = 0.38 + rand() * 0.12; // 38–50%
    awayProb = 0.25 + rand() * 0.10; // 25–35%
  } else {
    // Strong home favourite
    homeProb = 0.50 + rand() * 0.25; // 50–75%
    awayProb = 0.15 + rand() * 0.15; // 15–30%
  }

  const drawProb = Math.max(0.05, 1 - homeProb - awayProb);
  const margin = 0.07; // 7% bookmaker margin

  return {
    home: toOdds(homeProb, margin),
    draw: toOdds(drawProb, margin),
    away: toOdds(awayProb, margin),
  };
}

async function seedOdds(): Promise<void> {
  await connectDB();

  const matches = await Match.find({
    status: { $in: ['SCHEDULED', 'LIVE', 'FINISHED'] },
    odds: null,
  });

  if (matches.length === 0) {
    logger.info('All matches already have odds — nothing to seed');
    process.exit(0);
  }

  for (const match of matches) {
    // Use externalId as seed so odds are stable across re-runs
    const odds = generateOdds(match.externalId);
    match.odds = { ...odds, fetchedAt: new Date() };
    await match.save();
  }

  logger.info(`Seeded mock odds for ${matches.length} matches`);
  process.exit(0);
}

seedOdds().catch((err) => {
  logger.error({ err }, 'seedOdds failed');
  process.exit(1);
});
