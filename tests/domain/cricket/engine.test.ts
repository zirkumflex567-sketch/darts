import { CricketEngine } from '../../../src/domain/cricket';
import { Player } from '../../../src/shared/types';

const players: Player[] = [
  { id: 'p1', name: 'A', isBot: false },
  { id: 'p2', name: 'B', isBot: false },
  { id: 'p3', name: 'C', isBot: false },
];

describe('CricketEngine', () => {
  it('scores points in standard cricket when closed', () => {
    const { match } = CricketEngine.startGame({ variant: 'STANDARD' }, players.slice(0, 2));
    let res = CricketEngine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'T', source: 'MANUAL' }],
    });
    res = CricketEngine.applyVisit(res.match, {
      playerId: 'p2',
      throws: [{ segment: 1, multiplier: 'S', source: 'MANUAL' }],
    });
    res = CricketEngine.applyVisit(res.match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'S', source: 'MANUAL' }],
    });

    const state = CricketEngine.getLegState(res.match, res.match.legs[0]);
    expect(state.points['p1']).toBe(20);
  });

  it('assigns points to opponents in cut-throat', () => {
    const { match } = CricketEngine.startGame({ variant: 'CUT_THROAT' }, players);
    let res = CricketEngine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'T', source: 'MANUAL' }],
    });
    res = CricketEngine.applyVisit(res.match, {
      playerId: 'p2',
      throws: [{ segment: 1, multiplier: 'S', source: 'MANUAL' }],
    });
    res = CricketEngine.applyVisit(res.match, {
      playerId: 'p3',
      throws: [{ segment: 1, multiplier: 'S', source: 'MANUAL' }],
    });
    res = CricketEngine.applyVisit(res.match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'S', source: 'MANUAL' }],
    });

    const state = CricketEngine.getLegState(res.match, res.match.legs[0]);
    expect(state.points['p2']).toBe(20);
    expect(state.points['p3']).toBe(20);
  });
});
