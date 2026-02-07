import { X01Engine } from '../../../src/domain/x01';
import { calcMatchStats } from '../../../src/domain/stats';
import { Player } from '../../../src/shared/types';

const players: Player[] = [
  { id: 'p1', name: 'A', isBot: false },
  { id: 'p2', name: 'B', isBot: false },
];

describe('Stats', () => {
  it('calculates average and hit rate', () => {
    const { match } = X01Engine.startGame({ startScore: 301, outRule: 'SINGLE_OUT' }, players);
    const res = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 5, multiplier: 'S', source: 'MANUAL' },
        { segment: 1, multiplier: 'S', source: 'MANUAL' },
      ],
    });
    const stats = calcMatchStats(res.match);
    const p1 = stats.find((s) => s.playerId === 'p1');
    expect(p1).toBeTruthy();
    if (!p1) return;
    expect(p1.totalDarts).toBe(3);
    expect(p1.totalScore).toBe(66);
    expect(Math.round(p1.threeDartAverage)).toBe(66);
    expect(p1.hitRate).toBe(1);
  });
});
