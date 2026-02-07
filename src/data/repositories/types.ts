import { GameMode, MatchRecord, StatsRecord } from '../../shared/types';

export interface MatchListFilters {
  mode?: GameMode;
}

export interface MatchRepository {
  save(match: MatchRecord): Promise<void>;
  load(matchId: string): Promise<MatchRecord | null>;
  list(filters?: MatchListFilters): Promise<MatchRecord[]>;
}

export interface StatsRepository {
  save(stats: StatsRecord): Promise<void>;
  load(matchId: string): Promise<StatsRecord[]>;
}
