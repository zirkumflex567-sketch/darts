import {
  GameEvent,
  LegRecord,
  MatchRecord,
  Player,
  ThrowInput,
} from '../../shared/types';
import { CRICKET_TARGETS, MULTIPLIER_VALUES, SCHEMA_VERSION } from '../../shared/constants';
import { createId, nowIso } from '../../shared/utils';
import { CricketApplyResult, CricketConfig, CricketLegState, CricketStartResult, CricketVisitInput } from './types';

const scoreThrow = (input: ThrowInput) => {
  if (input.segment < 1 || (input.segment > 20 && input.segment !== 25)) {
    return 0;
  }
  if (input.segment === 25 && input.multiplier === 'T') {
    return 0;
  }
  const mult = MULTIPLIER_VALUES[input.multiplier];
  return input.segment * mult;
};

const buildEvent = (type: GameEvent['type'], matchId: string, legId: string, playerId?: string, payload?: Record<string, unknown>): GameEvent => ({
  id: createId('event'),
  type,
  timestamp: nowIso(),
  matchId,
  legId,
  playerId,
  payload,
});

const getPlayerOrder = (players: Player[], startingPlayerId: string) => {
  const startIndex = players.findIndex((p) => p.id === startingPlayerId);
  if (startIndex === -1) {
    throw new Error('Starting player not found');
  }
  return [...players.slice(startIndex), ...players.slice(0, startIndex)];
};

const getCurrentPlayerId = (leg: LegRecord, players: Player[]): string => {
  const order = getPlayerOrder(players, leg.startingPlayerId);
  const index = leg.visits.length % order.length;
  return order[index].id;
};

const initHits = (players: Player[]) => {
  const hits: Record<string, Record<number, number>> = {};
  players.forEach((p) => {
    hits[p.id] = {};
    CRICKET_TARGETS.forEach((t) => (hits[p.id][t] = 0));
  });
  return hits;
};

const initPoints = (players: Player[]) => {
  const points: Record<string, number> = {};
  players.forEach((p) => (points[p.id] = 0));
  return points;
};

const isClosed = (hits: Record<number, number>, target: number) => hits[target] >= 3;

const applyCricketThrow = (
  hits: Record<string, Record<number, number>>,
  points: Record<string, number>,
  players: Player[],
  playerId: string,
  input: ThrowInput,
  variant: 'STANDARD' | 'CUT_THROAT'
) => {
  const target = input.segment;
  if (!CRICKET_TARGETS.includes(target as (typeof CRICKET_TARGETS)[number])) {
    return;
  }

  const mult = MULTIPLIER_VALUES[input.multiplier];
  let remainingHits = mult;

  while (remainingHits > 0) {
    const currentHits = hits[playerId][target];
    if (currentHits < 3) {
      hits[playerId][target] = currentHits + 1;
    } else {
      const opponents = players.filter((p) => p.id !== playerId);
      const someoneOpen = opponents.some((p) => !isClosed(hits[p.id], target));
      if (someoneOpen) {
        if (variant === 'STANDARD') {
          points[playerId] += target;
        } else {
          opponents.forEach((p) => {
            if (!isClosed(hits[p.id], target)) {
              points[p.id] += target;
            }
          });
        }
      }
    }
    remainingHits -= 1;
  }
};

const computeLegState = (match: MatchRecord, leg: LegRecord): CricketLegState => {
  const variant = match.rules.cricketVariant ?? 'STANDARD';
  const hits = initHits(match.players);
  const points = initPoints(match.players);

  leg.visits.forEach((visit) => {
    visit.throws.forEach((t) => {
      applyCricketThrow(hits, points, match.players, visit.playerId, t, variant);
    });
  });

  let winnerPlayerId: string | undefined;
  let isFinished = false;

  match.players.forEach((player) => {
    const closedAll = CRICKET_TARGETS.every((t) => isClosed(hits[player.id], t));
    if (!closedAll) return;

    if (variant === 'STANDARD') {
      const hasTopScore = match.players.every((p) => points[player.id] >= points[p.id]);
      if (hasTopScore) {
        winnerPlayerId = player.id;
        isFinished = true;
      }
    } else {
      const hasLowestScore = match.players.every((p) => points[player.id] <= points[p.id]);
      if (hasLowestScore) {
        winnerPlayerId = player.id;
        isFinished = true;
      }
    }
  });

  return {
    hits,
    points,
    currentPlayerId: getCurrentPlayerId(leg, match.players),
    isFinished,
    winnerPlayerId,
  };
};

export const startGame = (config: CricketConfig, players: Player[]): CricketStartResult => {
  if (players.length < 1) throw new Error('At least one player required');

  const matchId = createId('match');
  const legId = createId('leg');
  const now = nowIso();

  const leg: LegRecord = {
    id: legId,
    matchId,
    legIndex: 0,
    startingPlayerId: players[0].id,
    visits: [],
    status: 'ACTIVE',
    startedAt: now,
  };

  const match: MatchRecord = {
    id: matchId,
    mode: 'CRICKET',
    rules: {
      cricketVariant: config.variant,
    },
    players,
    legs: [leg],
    currentLegId: legId,
    status: 'ACTIVE',
    startedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };

  const events: GameEvent[] = [
    buildEvent('MATCH_STARTED', matchId, legId),
    buildEvent('LEG_STARTED', matchId, legId, players[0].id),
  ];

  return { match, events };
};

export const applyVisit = (match: MatchRecord, input: CricketVisitInput): CricketApplyResult => {
  const leg = match.legs.find((l) => l.id === match.currentLegId);
  if (!leg) throw new Error('Leg not found');
  if (leg.status === 'FINISHED') throw new Error('Leg already finished');
  if (input.throws.length === 0 || input.throws.length > 3) throw new Error('Invalid throw count');

  const expectedPlayerId = getCurrentPlayerId(leg, match.players);
  if (expectedPlayerId !== input.playerId) throw new Error('Unexpected player');

  const visitId = createId('visit');
  const visit = {
    id: visitId,
    legId: leg.id,
    playerId: input.playerId,
    index: leg.visits.length,
    createdAt: nowIso(),
    isBust: false,
    throws: input.throws.map((t) => ({
      id: createId('throw'),
      visitId,
      segment: t.segment,
      multiplier: t.multiplier,
      score: scoreThrow(t),
      createdAt: nowIso(),
      source: t.source,
    })),
  };

  const nextLeg: LegRecord = {
    ...leg,
    visits: [...leg.visits, visit],
  };

  const nextMatch: MatchRecord = {
    ...match,
    legs: match.legs.map((l) => (l.id === leg.id ? nextLeg : l)),
  };

  const state = computeLegState(nextMatch, nextLeg);

  if (state.isFinished) {
    nextLeg.status = 'FINISHED';
    nextLeg.winnerPlayerId = state.winnerPlayerId;
    nextLeg.finishedAt = nowIso();
    nextMatch.status = 'FINISHED';
    nextMatch.finishedAt = nowIso();
  }

  const events: GameEvent[] = [buildEvent('VISIT_APPLIED', match.id, leg.id, input.playerId)];
  if (state.isFinished && state.winnerPlayerId) {
    events.push(buildEvent('LEG_FINISHED', match.id, leg.id, state.winnerPlayerId));
    events.push(buildEvent('MATCH_FINISHED', match.id, leg.id, state.winnerPlayerId));
  }

  return { match: nextMatch, events };
};

export const undoLastVisit = (match: MatchRecord): CricketApplyResult => {
  const leg = match.legs.find((l) => l.id === match.currentLegId);
  if (!leg) throw new Error('Leg not found');
  if (leg.visits.length === 0) throw new Error('No visits to undo');

  const lastVisit = leg.visits[leg.visits.length - 1];

  const nextLeg: LegRecord = {
    ...leg,
    visits: leg.visits.slice(0, -1),
    status: 'ACTIVE',
    winnerPlayerId: undefined,
    finishedAt: undefined,
  };

  const nextMatch: MatchRecord = {
    ...match,
    legs: match.legs.map((l) => (l.id === leg.id ? nextLeg : l)),
    status: 'ACTIVE',
    finishedAt: undefined,
  };

  const events: GameEvent[] = [buildEvent('VISIT_UNDONE', match.id, leg.id, lastVisit.playerId)];

  return { match: nextMatch, events };
};

export const getLegState = (match: MatchRecord, leg: LegRecord): CricketLegState => computeLegState(match, leg);

export const CricketEngine = {
  startGame,
  applyVisit,
  undoLastVisit,
  getLegState,
};
