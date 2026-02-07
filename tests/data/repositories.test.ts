import { InMemoryMatchRepository, InMemoryStatsRepository } from '../../src/data/repositories/InMemoryRepositories';
import { MatchRecord, StatsRecord } from '../../src/shared/types';

const sampleMatch: MatchRecord = {
  id: 'm1',
  mode: 'X01',
  rules: { x01StartScore: 501, x01OutRule: 'SINGLE_OUT' },
  players: [{ id: 'p1', name: 'A', isBot: false }],
  legs: [],
  currentLegId: 'l1',
  status: 'ACTIVE',
  startedAt: new Date().toISOString(),
  schemaVersion: 1,
};

const sampleStats: StatsRecord = {
  id: 's1',
  matchId: 'm1',
  playerId: 'p1',
  threeDartAverage: 45,
  checkoutAttempts: 1,
  checkoutSuccess: 1,
  checkoutRate: 1,
  hitRate: 0.8,
  totalDarts: 15,
  totalScore: 225,
};

describe('Repositories', () => {
  it('saves and loads matches', async () => {
    const repo = new InMemoryMatchRepository();
    await repo.save(sampleMatch);
    const loaded = await repo.load('m1');
    expect(loaded?.id).toBe('m1');
  });

  it('saves and loads stats', async () => {
    const repo = new InMemoryStatsRepository();
    await repo.save(sampleStats);
    const loaded = await repo.load('m1');
    expect(loaded.length).toBe(1);
  });
});
