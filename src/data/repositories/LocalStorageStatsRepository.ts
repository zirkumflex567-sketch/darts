import { StatsRecord } from '../../shared/types';
import { StatsRepository } from './types';

const STORAGE_KEY = 'dartsmind.stats';

const loadAll = (): StatsRecord[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StatsRecord[];
  } catch {
    return [];
  }
};

const saveAll = (stats: StatsRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export class LocalStorageStatsRepository implements StatsRepository {
  async save(stats: StatsRecord): Promise<void> {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === stats.id);
    if (idx >= 0) {
      all[idx] = stats;
    } else {
      all.push(stats);
    }
    saveAll(all);
  }

  async load(matchId: string): Promise<StatsRecord[]> {
    const all = loadAll();
    return all.filter((s) => s.matchId === matchId);
  }
}
