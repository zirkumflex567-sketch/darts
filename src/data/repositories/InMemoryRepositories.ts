import { MatchRecord, StatsRecord } from '../../shared/types';
import { MatchListFilters, MatchRepository, StatsRepository } from './types';

export class InMemoryMatchRepository implements MatchRepository {
  private matches: MatchRecord[] = [];

  async save(match: MatchRecord): Promise<void> {
    const idx = this.matches.findIndex((m) => m.id === match.id);
    if (idx >= 0) this.matches[idx] = match;
    else this.matches.push(match);
  }

  async load(matchId: string): Promise<MatchRecord | null> {
    return this.matches.find((m) => m.id === matchId) ?? null;
  }

  async list(filters?: MatchListFilters): Promise<MatchRecord[]> {
    if (!filters?.mode) return [...this.matches];
    return this.matches.filter((m) => m.mode === filters.mode);
  }
}

export class InMemoryStatsRepository implements StatsRepository {
  private stats: StatsRecord[] = [];

  async save(stats: StatsRecord): Promise<void> {
    const idx = this.stats.findIndex((s) => s.id === stats.id);
    if (idx >= 0) this.stats[idx] = stats;
    else this.stats.push(stats);
  }

  async load(matchId: string): Promise<StatsRecord[]> {
    return this.stats.filter((s) => s.matchId === matchId);
  }
}
