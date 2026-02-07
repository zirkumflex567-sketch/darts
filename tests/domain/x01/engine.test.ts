import { X01Engine } from '../../../src/domain/x01';
import { Player } from '../../../src/shared/types';

const players: Player[] = [
  { id: 'p1', name: 'A', isBot: false },
  { id: 'p2', name: 'B', isBot: false },
];

describe('X01Engine', () => {
  it('applies a normal visit', () => {
    const { match } = X01Engine.startGame({ startScore: 301, outRule: 'SINGLE_OUT' }, players);
    const result = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'T', source: 'MANUAL' }],
    });
    const state = X01Engine.getLegState(result.match, result.match.legs[0]);
    expect(state.remaining['p1']).toBe(241);
  });

  it('handles bust on below zero', () => {
    let { match } = X01Engine.startGame({ startScore: 210, outRule: 'SINGLE_OUT' }, players);

    match = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
      ],
    }).match;

    match = X01Engine.applyVisit(match, {
      playerId: 'p2',
      throws: [
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
      ],
    }).match;

    match = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 1, multiplier: 'S', source: 'MANUAL' }],
    }).match;

    const result = X01Engine.applyVisit(match, {
      playerId: 'p2',
      throws: [{ segment: 20, multiplier: 'T', source: 'MANUAL' }],
    });

    const state = X01Engine.getLegState(result.match, result.match.legs[0]);
    expect(state.remaining['p2']).toBe(30);
  });

  it('requires double out when enabled', () => {
    let { match } = X01Engine.startGame({ startScore: 210, outRule: 'DOUBLE_OUT' }, players);

    match = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
      ],
    }).match;

    match = X01Engine.applyVisit(match, {
      playerId: 'p2',
      throws: [
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
        { segment: 20, multiplier: 'T', source: 'MANUAL' },
      ],
    }).match;

    match = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 10, multiplier: 'S', source: 'MANUAL' }],
    }).match;

    match = X01Engine.applyVisit(match, {
      playerId: 'p2',
      throws: [{ segment: 1, multiplier: 'S', source: 'MANUAL' }],
    }).match;

    const result = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'S', source: 'MANUAL' }],
    });

    const state = X01Engine.getLegState(result.match, result.match.legs[0]);
    expect(state.remaining['p1']).toBe(20);
  });

  it('undoes last visit', () => {
    const { match } = X01Engine.startGame({ startScore: 301, outRule: 'SINGLE_OUT' }, players);
    const result = X01Engine.applyVisit(match, {
      playerId: 'p1',
      throws: [{ segment: 20, multiplier: 'T', source: 'MANUAL' }],
    });
    const undone = X01Engine.undoLastVisit(result.match);
    const state = X01Engine.getLegState(undone.match, undone.match.legs[0]);
    expect(state.remaining['p1']).toBe(301);
  });
});
