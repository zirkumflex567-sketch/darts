import { getDb, initDb } from '../db/sqlite';
import { StatsRecord } from '../../shared/types';
import { StatsRepository } from './types';

export class SQLiteStatsRepository implements StatsRepository {
  private initialized = false;

  private async ensureInit() {
    if (!this.initialized) {
      await initDb();
      this.initialized = true;
    }
  }

  async save(stats: StatsRecord): Promise<void> {
    await this.ensureInit();
    const db = await getDb();
    const data = JSON.stringify(stats);
    await db.runAsync('INSERT OR REPLACE INTO stats (id, matchId, data) VALUES (?, ?, ?)', [
      stats.id,
      stats.matchId,
      data,
    ]);
  }

  async load(matchId: string): Promise<StatsRecord[]> {
    await this.ensureInit();
    const db = await getDb();
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM stats WHERE matchId = ?', [matchId]);
    return rows.map((r) => JSON.parse(r.data) as StatsRecord);
  }
}
