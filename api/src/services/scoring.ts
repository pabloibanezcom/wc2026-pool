import { IMatchOdds, MatchStage } from '../models/Match';

const STAGE_MULTIPLIERS: Record<MatchStage, number> = {
  GROUP: 1,
  ROUND_OF_32: 1.5,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 2.5,
  SEMI_FINAL: 3,
  THIRD_PLACE: 4,
  FINAL: 4,
};

export interface ScoreInput {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
  stage: MatchStage;
  odds?: IMatchOdds | null;
}

// Converts decimal odds into an upset multiplier.
// Heavy favourites (odds ≤ 2) → 1.0 (no bonus).
// Underdogs (odds > 2) → up to 4.0.
function oddsMultiplier(odds: number | null | undefined): number {
  if (!odds || odds <= 0) return 1.0;
  return Math.max(1.0, Math.min(odds / 2, 4.0));
}

export function calculatePoints(input: ScoreInput): number {
  const { predictedHome, predictedAway, actualHome, actualAway, stage, odds } = input;

  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;
  const predictedOutcome = Math.sign(predictedDiff);
  const actualOutcome = Math.sign(actualDiff);

  let base = 0;

  if (predictedHome === actualHome && predictedAway === actualAway) {
    base = 10; // Exact score
  } else if (predictedOutcome === actualOutcome) {
    if (actualOutcome === 0) {
      base = 5; // Correct draw, wrong score
    } else if (predictedDiff === actualDiff) {
      base = 6; // Correct goal difference + correct winner
    } else {
      base = 4; // Correct winner only
    }
  }

  if (base === 0) return 0;

  // Apply odds multiplier based on the actual outcome's pre-match odds
  let outcomeOdds: number | null = null;
  if (odds) {
    if (actualOutcome > 0) outcomeOdds = odds.home;
    else if (actualOutcome < 0) outcomeOdds = odds.away;
    else outcomeOdds = odds.draw;
  }

  return Math.round(base * STAGE_MULTIPLIERS[stage] * oddsMultiplier(outcomeOdds));
}
