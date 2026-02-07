import { ScoringHit, ScoringProvider, ScoringStatus } from '../../domain/scoring/types';

const randomSegment = () => {
  const targets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
  return targets[Math.floor(Math.random() * targets.length)];
};

const randomMultiplier = () => {
  const values: Array<'S' | 'D' | 'T'> = ['S', 'D', 'T'];
  return values[Math.floor(Math.random() * values.length)];
};

export class DummyScoringProvider implements ScoringProvider {
  private statusValue: ScoringStatus = 'IDLE';
  private listeners: Array<(hit: ScoringHit) => void> = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start = () => {
    if (this.statusValue === 'RUNNING') return;
    this.statusValue = 'RUNNING';

    this.intervalId = setInterval(() => {
      const segment = randomSegment();
      let multiplier = randomMultiplier();
      if (segment === 25 && multiplier === 'T') {
        multiplier = 'D';
      }
      const points = segment * (multiplier === 'S' ? 1 : multiplier === 'D' ? 2 : 3);
      const hit: ScoringHit = { segment, multiplier, points, source: 'AUTO' };
      this.listeners.forEach((cb) => cb(hit));
    }, 4000);
  };

  stop = () => {
    this.statusValue = 'IDLE';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  status = () => this.statusValue;

  onHit = (cb: (hit: ScoringHit) => void) => {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== cb);
    };
  };
}
