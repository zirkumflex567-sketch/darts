import { getDb, initDb } from '../db/sqlite';
import { MatchRecord } from '../../shared/types';
import { MatchListFilters, MatchRepository } from './types';
import { nowIso } from '../../shared/utils';

export class SQLiteMatchRepository implements MatchRepository {
  private initialized = false;

  private async ensureInit() {
    if (!this.initialized) {
      await initDb();
      this.initialized = true;
    }
  }

  async save(match: MatchRecord): Promise<void> {
    await this.ensureInit();
    const db = await getDb();
    const updatedAt = nowIso();
    const data = JSON.stringify(match);
    await db.runAsync(
      'INSERT OR REPLACE INTO matches (id, mode, data, updatedAt) VALUES (?, ?, ?, ?)',
      [match.id, match.mode, data, updatedAt]
    );
  }

  async load(matchId: string): Promise<MatchRecord | null> {
    await this.ensureInit();
    const db = await getDb();
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM matches WHERE id = ?', [matchId]);
    if (!row) return null;
    return JSON.parse(row.data) as MatchRecord;
  }

  async list(filters?: MatchListFilters): Promise<MatchRecord[]> {
    await this.ensureInit();
    const db = await getDb();
    let query = 'SELECT data FROM matches';
    const args: string[] = [];
    if (filters?.mode) {
      query += ' WHERE mode = ?';
      args.push(filters.mode);
    }
    query += ' ORDER BY updatedAt DESC';
    const rows = await db.getAllAsync<{ data: string }>(query, args);
    return rows.map((r) => JSON.parse(r.data) as MatchRecord);
  }
}
