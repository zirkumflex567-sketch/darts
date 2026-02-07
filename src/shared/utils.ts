export const nowIso = () => new Date().toISOString();

export const createId = (prefix: string) => {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
