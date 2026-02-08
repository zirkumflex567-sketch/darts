export interface Point {
  x: number;
  y: number;
}

export type Homography = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

const solveLinearSystem = (matrix: number[][], vector: number[]): number[] | null => {
  const n = vector.length;
  const aug = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) {
        pivot = row;
      }
    }

    if (Math.abs(aug[pivot][col]) < 1e-12) {
      return null;
    }

    if (pivot !== col) {
      const temp = aug[col];
      aug[col] = aug[pivot];
      aug[pivot] = temp;
    }

    const divisor = aug[col][col];
    for (let k = col; k <= n; k += 1) {
      aug[col][k] /= divisor;
    }

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let k = col; k <= n; k += 1) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
  }

  return aug.map((row) => row[n]);
};

export const computeHomography = (src: Point[], dst: Point[]): Homography | null => {
  if (src.length !== 4 || dst.length !== 4) return null;

  const matrix: number[][] = [];
  const vector: number[] = [];

  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];

    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);

    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  }

  const solution = solveLinearSystem(matrix, vector);
  if (!solution) return null;

  const [h11, h12, h13, h21, h22, h23, h31, h32] = solution;

  return [
    [h11, h12, h13],
    [h21, h22, h23],
    [h31, h32, 1],
  ];
};

export const applyHomography = (homography: Homography, point: Point): Point | null => {
  const { x, y } = point;
  const denom = homography[2][0] * x + homography[2][1] * y + homography[2][2];
  if (Math.abs(denom) < 1e-12) return null;
  const u = (homography[0][0] * x + homography[0][1] * y + homography[0][2]) / denom;
  const v = (homography[1][0] * x + homography[1][1] * y + homography[1][2]) / denom;
  return { x: u, y: v };
};
