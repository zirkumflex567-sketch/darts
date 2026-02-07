import { create } from 'zustand';
import { GameMode, MatchRecord, Player, ThrowInput } from '../../shared/types';
import { X01Engine, X01LegState } from '../../domain/x01';
import { CricketEngine, CricketLegState } from '../../domain/cricket';
import { ScoringHit } from '../../domain/scoring/types';
import { DummyScoringProvider } from '../../data/scoring/DummyScoringProvider';
import { createMatchRepository, createStatsRepository } from '../../data/repositories';
import { calcMatchStats } from '../../domain/stats';
import { createId } from '../../shared/utils';

interface GameStoreState {
  mode: GameMode | null;
  players: Player[];
  match: MatchRecord | null;
  x01State: X01LegState | null;
  cricketState: CricketLegState | null;
  currentHit: ScoringHit | null;
  hitModalOpen: boolean;
  dummyScoringActive: boolean;
  history: MatchRecord[];
  setMode: (mode: GameMode) => void;
  setPlayers: (players: Player[]) => void;
  startMatch: (mode: GameMode) => Promise<void>;
  queueDetectedHit: (hit: ScoringHit) => void;
  applyManualHit: (hit: ScoringHit) => Promise<void>;
  undoLastVisit: () => void;
  toggleDummyScoring: () => void;
  openManualHit: () => void;
  closeHitModal: () => void;
  loadHistory: () => Promise<void>;
}

const matchRepo = createMatchRepository();
const statsRepo = createStatsRepository();
const dummyProvider = new DummyScoringProvider();
let dummyUnsubscribe: (() => void) | null = null;

export const useGameStore = create<GameStoreState>((set, get) => ({
  mode: null,
  players: [],
  match: null,
  x01State: null,
  cricketState: null,
  currentHit: null,
  hitModalOpen: false,
  dummyScoringActive: false,
  history: [],
  setMode: (mode) => set({ mode }),
  setPlayers: (players) => set({ players }),
  startMatch: async (mode) => {
    const players = get().players.length
      ? get().players
      : [
          { id: createId('player'), name: 'Player 1', isBot: false },
          { id: createId('player'), name: 'Player 2', isBot: false },
        ];

    if (mode === 'X01') {
      const { match } = X01Engine.startGame({ startScore: 501, outRule: 'SINGLE_OUT' }, players);
      await matchRepo.save(match);
      set({ match, mode, x01State: X01Engine.getLegState(match, match.legs[0]), cricketState: null });
    } else {
      const { match } = CricketEngine.startGame({ variant: 'STANDARD' }, players);
      await matchRepo.save(match);
      set({ match, mode, cricketState: CricketEngine.getLegState(match, match.legs[0]), x01State: null });
    }
  },
  queueDetectedHit: (hit) => set({ currentHit: hit, hitModalOpen: true }),
  applyManualHit: async (hit) => {
    const match = get().match;
    const mode = get().mode;
    if (!match || !mode) return;

    const leg = match.legs.find((l) => l.id === match.currentLegId) ?? match.legs[0];
    const playerId = mode === 'X01'
      ? X01Engine.getLegState(match, leg).currentPlayerId
      : CricketEngine.getLegState(match, leg).currentPlayerId;

    const throwInput: ThrowInput = {
      segment: hit.segment,
      multiplier: hit.multiplier,
      source: hit.source,
    };

    if (mode === 'X01') {
      const { match: nextMatch } = X01Engine.applyVisit(match, {
        playerId,
        throws: [throwInput],
      });
      await matchRepo.save(nextMatch);
      if (nextMatch.status === 'FINISHED') {
        const stats = calcMatchStats(nextMatch);
        for (const s of stats) {
          await statsRepo.save(s);
        }
      }
      set({
        match: nextMatch,
        x01State: X01Engine.getLegState(nextMatch, nextMatch.legs[0]),
        hitModalOpen: false,
        currentHit: null,
      });
    } else {
      const { match: nextMatch } = CricketEngine.applyVisit(match, {
        playerId,
        throws: [throwInput],
      });
      await matchRepo.save(nextMatch);
      set({
        match: nextMatch,
        cricketState: CricketEngine.getLegState(nextMatch, nextMatch.legs[0]),
        hitModalOpen: false,
        currentHit: null,
      });
    }
  },
  undoLastVisit: () => {
    const match = get().match;
    const mode = get().mode;
    if (!match || !mode) return;

    if (mode === 'X01') {
      const { match: nextMatch } = X01Engine.undoLastVisit(match);
      set({ match: nextMatch, x01State: X01Engine.getLegState(nextMatch, nextMatch.legs[0]) });
    } else {
      const { match: nextMatch } = CricketEngine.undoLastVisit(match);
      set({ match: nextMatch, cricketState: CricketEngine.getLegState(nextMatch, nextMatch.legs[0]) });
    }
  },
  toggleDummyScoring: () => {
    const active = get().dummyScoringActive;
    if (active) {
      dummyProvider.stop();
      if (dummyUnsubscribe) dummyUnsubscribe();
      dummyUnsubscribe = null;
      set({ dummyScoringActive: false });
    } else {
      dummyProvider.start();
      dummyUnsubscribe = dummyProvider.onHit((hit) => {
        set({ currentHit: hit, hitModalOpen: true });
      });
      set({ dummyScoringActive: true });
    }
  },
  openManualHit: () => {
    set({
      currentHit: { segment: 20, multiplier: 'S', points: 20, source: 'MANUAL' },
      hitModalOpen: true,
    });
  },
  closeHitModal: () => set({ hitModalOpen: false, currentHit: null }),
  loadHistory: async () => {
    const matches = await matchRepo.list();
    set({ history: matches });
  },
}));
