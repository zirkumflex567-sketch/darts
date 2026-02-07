export type ScoringStatus = 'IDLE' | 'RUNNING' | 'ERROR';

export interface ScoringHit {
  segment: number;
  multiplier: 'S' | 'D' | 'T';
  points: number;
  source: 'AUTO' | 'MANUAL';
}

export interface ScoringProvider {
  start: () => void;
  stop: () => void;
  status: () => ScoringStatus;
  onHit: (cb: (hit: ScoringHit) => void) => () => void;
}
