export type GameMode = 'X01' | 'CRICKET';
export type X01OutRule = 'SINGLE_OUT' | 'DOUBLE_OUT';
export type CricketVariant = 'STANDARD' | 'CUT_THROAT';
export type Multiplier = 'S' | 'D' | 'T';

export type MatchStatus = 'ACTIVE' | 'FINISHED';
export type LegStatus = 'ACTIVE' | 'FINISHED';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
}

export interface ThrowInput {
  segment: number; // 1-20 or 25
  multiplier: Multiplier;
  source: 'AUTO' | 'MANUAL';
}

export interface ThrowRecord extends ThrowInput {
  id: string;
  visitId: string;
  score: number;
  createdAt: string;
}

export interface VisitRecord {
  id: string;
  legId: string;
  playerId: string;
  index: number;
  throws: ThrowRecord[];
  createdAt: string;
  isBust: boolean;
}

export interface LegRecord {
  id: string;
  matchId: string;
  legIndex: number;
  startingPlayerId: string;
  visits: VisitRecord[];
  status: LegStatus;
  winnerPlayerId?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface GameRules {
  x01StartScore?: number;
  x01OutRule?: X01OutRule;
  cricketVariant?: CricketVariant;
}

export interface MatchRecord {
  id: string;
  mode: GameMode;
  rules: GameRules;
  players: Player[];
  legs: LegRecord[];
  currentLegId: string;
  status: MatchStatus;
  startedAt: string;
  finishedAt?: string;
  schemaVersion: number;
}

export interface StatsRecord {
  id: string;
  matchId: string;
  playerId: string;
  threeDartAverage: number;
  checkoutAttempts: number;
  checkoutSuccess: number;
  checkoutRate: number;
  hitRate: number;
  totalDarts: number;
  totalScore: number;
}

export interface GameEvent {
  id: string;
  type:
    | 'MATCH_STARTED'
    | 'LEG_STARTED'
    | 'VISIT_APPLIED'
    | 'VISIT_BUSTED'
    | 'LEG_FINISHED'
    | 'MATCH_FINISHED'
    | 'VISIT_UNDONE';
  timestamp: string;
  matchId: string;
  legId: string;
  playerId?: string;
  payload?: Record<string, unknown>;
}
