export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatarUrl: string;
  totalPoints: number;
  isMaster?: boolean;
}

export type MatchStage =
  | 'GROUP'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
export type MatchWinner = 'HOME' | 'AWAY' | 'DRAW';

export interface TeamInfo {
  name: string;
  code: string;
  crest: string;
  color: string;
}

export interface TeamOption {
  name: string;
  code: string;
  crest?: string;
  color?: string;
}

export interface PlayerOption {
  name: string;
  team: string;
  code: string;
  pos: 'FW' | 'MF' | 'DF' | 'GK';
  age: number;
}

export interface TournamentCatalogTeam extends TeamOption {
  players: Array<{
    name: string;
    pos: PlayerOption['pos'];
    age: number;
  }>;
}

export interface TournamentPicks {
  champion?: TeamOption;
  runnerUp?: TeamOption;
  semi1?: TeamOption;
  semi2?: TeamOption;
  bestPlayer?: PlayerOption;
  topScorer?: PlayerOption;
  bestYoung?: PlayerOption;
}

export const TOURNAMENT_SLOT_KEYS: (keyof TournamentPicks)[] = [
  'champion', 'runnerUp', 'semi1', 'semi2', 'bestPlayer', 'topScorer', 'bestYoung',
];

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

export interface Prediction {
  _id: string;
  userId: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  predictedWinner: MatchWinner;
  qualifier: 'HOME' | 'AWAY' | null;
  points: number | null;
}

export interface GroupPrediction {
  _id: string;
  userId: string;
  group: string;
  orderedTeamCodes: string[];
  orderedTeams: TeamInfo[];
  points: number | null;
  progress?: {
    projectedPoints: number;
    perfectBonus: number;
    currentOrderCodes: string[];
    currentOrder: Array<TeamInfo & {
      position: number;
      played: number;
      points: number;
      goalDifference: number;
    }>;
    teams: Array<{
      code: string;
      predictedPosition: number;
      currentPosition: number | null;
      points: number;
      status: 'exact' | 'qualified' | 'miss' | 'pending';
    }>;
  } | null;
}

export interface LeagueMember {
  userId: User;
  joinedAt: string;
  isAdmin?: boolean;
  totalPoints?: number;
}

export interface League {
  _id: string;
  name: string;
  inviteCode: string;
  ownerId: User;
  members: LeagueMember[];
  maxMembers: number;
}
