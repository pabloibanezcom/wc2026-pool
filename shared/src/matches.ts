import { z } from 'zod';
import type { TeamInfo } from './teams';

export const matchStageSchema = z.enum([
  'GROUP',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
]);

export const matchStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']);
export const matchWinnerSchema = z.enum(['HOME', 'AWAY', 'DRAW']);

export type MatchStage = z.infer<typeof matchStageSchema>;
export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type MatchWinner = z.infer<typeof matchWinnerSchema>;

export const MATCH_STAGES = matchStageSchema.options;
export const MATCH_STATUSES = matchStatusSchema.options;
export const MATCH_WINNERS = matchWinnerSchema.options;

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  winner: MatchWinner;
}

export interface MatchOdds {
  home: number | null;
  draw: number | null;
  away: number | null;
}

export interface Match {
  _id: string;
  externalId: number;
  stage: MatchStage;
  group: string | null;
  matchday: number;
  homeTeamCode: string;
  awayTeamCode: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  utcDate: string;
  status: MatchStatus;
  result: MatchResult | null;
  odds?: MatchOdds | null;
}
