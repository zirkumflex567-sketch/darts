import { CricketVariant, GameEvent, LegRecord, MatchRecord, Player, ThrowInput } from '../../shared/types';

export interface CricketConfig {
  variant: CricketVariant;
}

export interface CricketStartResult {
  match: MatchRecord;
  events: GameEvent[];
}

export interface CricketVisitInput {
  playerId: string;
  throws: ThrowInput[];
}

export interface CricketApplyResult {
  match: MatchRecord;
  events: GameEvent[];
}

export interface CricketLegState {
  hits: Record<string, Record<number, number>>;
  points: Record<string, number>;
  currentPlayerId: string;
  isFinished: boolean;
  winnerPlayerId?: string;
}

export interface CricketEngineApi {
  startGame(config: CricketConfig, players: Player[]): CricketStartResult;
  applyVisit(match: MatchRecord, input: CricketVisitInput): CricketApplyResult;
  undoLastVisit(match: MatchRecord): CricketApplyResult;
  getLegState(match: MatchRecord, leg: LegRecord): CricketLegState;
}
