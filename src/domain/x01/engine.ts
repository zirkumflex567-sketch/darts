import {
  GameEvent,
  GameRules,
  LegRecord,
  MatchRecord,
  Player,
  ThrowInput,
  ThrowRecord,
  VisitRecord,
} from '../../shared/types';
import { MULTIPLIER_VALUES, SCHEMA_VERSION, X01_START_MAX, X01_START_MIN } from '../../shared/constants';
import { createId, nowIso } from '../../shared/utils';
import { X01ApplyResult, X01Config, X01LegState, X01StartResult, X01VisitInput } from './types';

const getStartScore = (config: X01Config) => {
  if (config.startScore < X01_START_MIN || config.startScore > X01_START_MAX) {
    throw new Error('X01 start score out of range');
  }
  return config.startScore;
};

const scoreThrow = (input: ThrowInput) => {
  if (input.segment < 1 || (input.segment > 20 && input.segment !== 25)) {
    throw new Error('Invalid segment');
  }
  if (input.segment === 25 && input.multiplier === 'T') {
    throw new Error('Invalid multiplier for Bull');
  }
  const mult = MULTIPLIER_VALUES[input.multiplier];
  return input.segment * mult;
};

const buildThrowRecord = (visitId: string, input: ThrowInput): ThrowRecord => ({
  id: createId('throw'),
  visitId,
  segment: input.segment,
  multiplier: input.multiplier,
  score: scoreThrow(input),
  createdAt: nowIso(),
  source: input.source,
});

const buildVisitRecord = (
  legId: string,
  playerId: string,
  index: number,
  throwsInput: ThrowInput[],
  isBust: boolean
): VisitRecord => {
  const visitId = createId('visit');
  return {
    id: visitId,
    legId,
    playerId,
    index,
    throws: throwsInput.map((t) => buildThrowRecord(visitId, t)),
    createdAt: nowIso(),
    isBust,
  };
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

export const getLegState = (match: MatchRecord, leg: LegRecord): X01LegState => {
  const startScore = getStartScore({
    startScore: match.rules.x01StartScore ?? 501,
    outRule: match.rules.x01OutRule ?? 'SINGLE_OUT',
  });
  const remaining: Record<string, number> = {};
  match.players.forEach((p) => (remaining[p.id] = startScore));

  let winnerPlayerId: string | undefined;
  leg.visits.forEach((visit) => {
    if (visit.isBust) return;
    const total = visit.throws.reduce((sum, t) => sum + t.score, 0);
    remaining[visit.playerId] -= total;
    if (remaining[visit.playerId] === 0) {
      winnerPlayerId = visit.playerId;
    }
  });

  return {
    remaining,
    currentPlayerId: getCurrentPlayerId(leg, match.players),
    isFinished: leg.status === 'FINISHED',
    winnerPlayerId,
  };
};

export const startGame = (config: X01Config, players: Player[]): X01StartResult => {
  const startScore = getStartScore(config);
  if (players.length < 1) {
    throw new Error('At least one player required');
  }

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
    mode: 'X01',
    rules: {
      x01StartScore: startScore,
      x01OutRule: config.outRule ?? 'SINGLE_OUT',
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

export const applyVisit = (match: MatchRecord, input: X01VisitInput): X01ApplyResult => {
  const leg = match.legs.find((l) => l.id === match.currentLegId);
  if (!leg) throw new Error('Leg not found');
  if (leg.status === 'FINISHED') throw new Error('Leg already finished');
  if (input.throws.length === 0 || input.throws.length > 3) throw new Error('Invalid throw count');

  const expectedPlayerId = getCurrentPlayerId(leg, match.players);
  if (expectedPlayerId !== input.playerId) {
    throw new Error('Unexpected player');
  }

  const rules: GameRules = match.rules;
  const outRule = rules.x01OutRule ?? 'SINGLE_OUT';
  const startScore = rules.x01StartScore ?? 501;

  const stateBefore = getLegState(match, leg);
  const currentRemaining = stateBefore.remaining[input.playerId];

  let remaining = currentRemaining;
  let isBust = false;
  const appliedThrows: ThrowInput[] = [];

  for (const t of input.throws) {
    const score = scoreThrow(t);
    remaining -= score;

    if (remaining < 0) {
      isBust = true;
      break;
    }

    if (outRule === 'DOUBLE_OUT') {
      if (remaining === 1) {
        isBust = true;
        break;
      }
      if (remaining === 0 && t.multiplier !== 'D') {
        isBust = true;
        break;
      }
    }

    appliedThrows.push(t);

    if (remaining === 0) {
      break;
    }
  }

  if (isBust) {
    remaining = currentRemaining;
  }

  const visit = buildVisitRecord(leg.id, input.playerId, leg.visits.length, appliedThrows, isBust);
  const nextLeg: LegRecord = {
    ...leg,
    visits: [...leg.visits, visit],
  };

  let matchFinished = false;
  let legFinished = false;

  if (!isBust && remaining === 0) {
    legFinished = true;
    nextLeg.status = 'FINISHED';
    nextLeg.winnerPlayerId = input.playerId;
    nextLeg.finishedAt = nowIso();
    matchFinished = true;
  }

  const nextMatch: MatchRecord = {
    ...match,
    legs: match.legs.map((l) => (l.id === leg.id ? nextLeg : l)),
    status: matchFinished ? 'FINISHED' : match.status,
    finishedAt: matchFinished ? nowIso() : match.finishedAt,
  };

  const events: GameEvent[] = [
    buildEvent(isBust ? 'VISIT_BUSTED' : 'VISIT_APPLIED', match.id, leg.id, input.playerId, {
      scoreBefore: currentRemaining,
      scoreAfter: remaining,
      isBust,
    }),
  ];

  if (legFinished) {
    events.push(buildEvent('LEG_FINISHED', match.id, leg.id, input.playerId));
  }
  if (matchFinished) {
    events.push(buildEvent('MATCH_FINISHED', match.id, leg.id, input.playerId));
  }

  return { match: nextMatch, events };
};

export const undoLastVisit = (match: MatchRecord): X01ApplyResult => {
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

export const X01Engine = {
  startGame,
  applyVisit,
  undoLastVisit,
  getLegState,
};
