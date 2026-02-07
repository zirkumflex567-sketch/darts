import { GameRules, MatchRecord, StatsRecord, ThrowRecord, VisitRecord } from '../../shared/types';
import { MULTIPLIER_VALUES } from '../../shared/constants';
import { createId } from '../../shared/utils';

const getThrowScore = (throwRec: ThrowRecord) => throwRec.score;

const isValidCheckout = (rules: GameRules, lastThrow: ThrowRecord, remainingAfter: number) => {
  if (remainingAfter !== 0) return false;
  if (rules.x01OutRule === 'DOUBLE_OUT') {
    return lastThrow.multiplier === 'D';
  }
  return true;
};

const applyVisitForStats = (
  remainingBefore: number,
  visit: VisitRecord,
  rules: GameRules
): { remainingAfter: number; isBust: boolean; isCheckout: boolean } => {
  let remaining = remainingBefore;
  let isBust = false;
  let isCheckout = false;

  for (const t of visit.throws) {
    const score = getThrowScore(t);
    remaining -= score;

    if (remaining < 0) {
      isBust = true;
      break;
    }

    if (rules.x01OutRule === 'DOUBLE_OUT') {
      if (remaining === 1) {
        isBust = true;
        break;
      }
      if (remaining === 0 && t.multiplier !== 'D') {
        isBust = true;
        break;
      }
    }

    if (remaining === 0) {
      isCheckout = true;
      break;
    }
  }

  if (isBust) {
    return { remainingAfter: remainingBefore, isBust: true, isCheckout: false };
  }

  return { remainingAfter: remaining, isBust: false, isCheckout };
};

export const calcMatchStats = (match: MatchRecord): StatsRecord[] => {
  if (match.mode !== 'X01') {
    return [];
  }

  const rules = match.rules;
  const startScore = rules.x01StartScore ?? 501;

  const statsByPlayer: Record<string, StatsRecord> = {};
  match.players.forEach((p) => {
    statsByPlayer[p.id] = {
      id: createId('stats'),
      matchId: match.id,
      playerId: p.id,
      threeDartAverage: 0,
      checkoutAttempts: 0,
      checkoutSuccess: 0,
      checkoutRate: 0,
      hitRate: 0,
      totalDarts: 0,
      totalScore: 0,
    };
  });

  const remaining: Record<string, number> = {};
  match.players.forEach((p) => (remaining[p.id] = startScore));

  const currentLeg = match.legs.find((l) => l.id === match.currentLegId) ?? match.legs[0];
  const visits = currentLeg?.visits ?? [];

  visits.forEach((visit) => {
    const playerStats = statsByPlayer[visit.playerId];
    const remainingBefore = remaining[visit.playerId];
    if (remainingBefore <= 170 && remainingBefore > 0) {
      playerStats.checkoutAttempts += 1;
    }

    const { remainingAfter, isBust, isCheckout } = applyVisitForStats(remainingBefore, visit, rules);
    remaining[visit.playerId] = remainingAfter;

    const dartsThrown = visit.throws.length;
    playerStats.totalDarts += dartsThrown;

    const scoredPoints = isBust ? 0 : visit.throws.reduce((sum, t) => sum + t.score, 0);
    playerStats.totalScore += scoredPoints;

    const hits = visit.throws.filter((t) => t.score > 0).length;
    playerStats.hitRate += hits;

    if (isCheckout) {
      playerStats.checkoutSuccess += 1;
    }
  });

  return match.players.map((p) => {
    const stats = statsByPlayer[p.id];
    const totalDarts = stats.totalDarts || 0;
    const totalScore = stats.totalScore || 0;
    const hitCount = stats.hitRate || 0;

    const threeDartAverage = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    const hitRate = totalDarts > 0 ? hitCount / totalDarts : 0;
    const checkoutRate = stats.checkoutAttempts > 0 ? stats.checkoutSuccess / stats.checkoutAttempts : 0;

    return {
      ...stats,
      threeDartAverage,
      hitRate,
      checkoutRate,
    };
  });
};

export const multiplierScore = (segment: number, multiplier: 'S' | 'D' | 'T') => {
  const mult = MULTIPLIER_VALUES[multiplier];
  return segment * mult;
};
