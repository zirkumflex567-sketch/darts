import { toByteArray } from 'base64-js';
import { applyHomography, computeHomography, Point } from './homography';

const jpeg = require('jpeg-js');

export interface DetectionSettings {
  centerX: number;
  centerY: number;
  scale: number;
  calibrationPoints?: Point[];
}

export interface DetectionResult {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  count: number;
}

interface DetectionOptions {
  threshold?: number;
  minCount?: number;
  maxCount?: number;
  sampleSize?: number;
}

const computeHomographyForSettings = (
  settings: DetectionSettings,
  width: number,
  height: number
): ReturnType<typeof computeHomography> => {
  if (!settings.calibrationPoints || settings.calibrationPoints.length !== 4) return null;
  const src = settings.calibrationPoints.map((pt) => ({ x: pt.x * width, y: pt.y * height }));
  const dst: Point[] = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
  ];
  return computeHomography(src, dst);
};

const isWithinBoard = (
  x: number,
  y: number,
  width: number,
  height: number,
  settings: DetectionSettings,
  homography: ReturnType<typeof computeHomography>
) => {
  if (homography) {
    const projected = applyHomography(homography, { x, y });
    if (!projected) return false;
    const r = Math.sqrt(projected.x * projected.x + projected.y * projected.y);
    return r <= 1.05;
  }

  const centerX = settings.centerX * width;
  const centerY = settings.centerY * height;
  const dx = x - centerX;
  const dy = centerY - y;
  const radius = Math.min(width, height) / 2;
  const effectiveRadius = radius * settings.scale;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = dist / effectiveRadius;
  return r <= 1.05;
};

export const detectDartFromDiff = (
  baselineBase64: string,
  currentBase64: string,
  settings: DetectionSettings,
  options: DetectionOptions = {}
): DetectionResult | null => {
  const threshold = options.threshold ?? 28;
  const minCount = options.minCount ?? 25;
  const maxCount = options.maxCount ?? 1800;
  const sampleSize = options.sampleSize ?? 200;

  const baseBytes = toByteArray(baselineBase64);
  const currentBytes = toByteArray(currentBase64);

  const baseline = jpeg.decode(baseBytes, { useTArray: true });
  const current = jpeg.decode(currentBytes, { useTArray: true });

  if (!baseline || !current) return null;
  if (baseline.width !== current.width || baseline.height !== current.height) return null;

  const { width, height } = baseline;
  const step = Math.max(1, Math.floor(Math.min(width, height) / sampleSize));
  const homography = computeHomographyForSettings(settings, width, height);

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (!isWithinBoard(x, y, width, height, settings, homography)) continue;
      const idx = (y * width + x) * 4;
      const baseValue =
        (baseline.data[idx] + baseline.data[idx + 1] + baseline.data[idx + 2]) / 3;
      const currValue =
        (current.data[idx] + current.data[idx + 1] + current.data[idx + 2]) / 3;
      const diff = Math.abs(currValue - baseValue);
      if (diff < threshold) continue;
      sumX += x;
      sumY += y;
      count += 1;
    }
  }

  if (count < minCount) return null;
  if (count > maxCount) return null;

  return {
    x: sumX / count / width,
    y: sumY / count / height,
    count,
  };
};
