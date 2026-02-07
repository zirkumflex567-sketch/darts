import { GameEvent, GameRules, LegRecord, MatchRecord, Player, ThrowInput } from '../../shared/types';

export interface X01Config {
  startScore: number;
  outRule: GameRules['x01OutRule'];
}

export interface X01StartResult {
  match: MatchRecord;
  events: GameEvent[];
}

export interface X01VisitInput {
  playerId: string;
  throws: ThrowInput[];
}

export interface X01ApplyResult {
  match: MatchRecord;
  events: GameEvent[];
}

export interface X01LegState {
  remaining: Record<string, number>;
  currentPlayerId: string;
  isFinished: boolean;
  winnerPlayerId?: string;
}

export interface X01EngineApi {
  startGame(config: X01Config, players: Player[]): X01StartResult;
  applyVisit(match: MatchRecord, input: X01VisitInput): X01ApplyResult;
  undoLastVisit(match: MatchRecord): X01ApplyResult;
  getLegState(match: MatchRecord, leg: LegRecord): X01LegState;
}
