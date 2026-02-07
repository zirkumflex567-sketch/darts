import { MatchRecord } from '../../shared/types';
import { MatchListFilters, MatchRepository } from './types';

const STORAGE_KEY = 'dartsmind.matches';

const loadAll = (): MatchRecord[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MatchRecord[];
  } catch {
    return [];
  }
};

const saveAll = (matches: MatchRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
};

export class LocalStorageMatchRepository implements MatchRepository {
  async save(match: MatchRecord): Promise<void> {
    const matches = loadAll();
    const existingIndex = matches.findIndex((m) => m.id === match.id);
    if (existingIndex >= 0) {
      matches[existingIndex] = match;
    } else {
      matches.push(match);
    }
    saveAll(matches);
  }

  async load(matchId: string): Promise<MatchRecord | null> {
    const matches = loadAll();
    return matches.find((m) => m.id === matchId) ?? null;
  }

  async list(filters?: MatchListFilters): Promise<MatchRecord[]> {
    let matches = loadAll();
    if (filters?.mode) {
      matches = matches.filter((m) => m.mode === filters.mode);
    }
    return matches;
  }
}
