import * as FileSystem from 'expo-file-system/legacy';

export interface DatasetAnnotation {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

export interface DatasetSample {
  id: string;
  fileName: string;
  uri: string;
  width: number;
  height: number;
  capturedAt: string;
  annotation?: DatasetAnnotation;
  settingsSnapshot: {
    centerX: number;
    centerY: number;
    scale: number;
    rotationDeg: number;
    calibrationPoints?: { x: number; y: number }[];
  };
}

const DATASET_DIR = `${FileSystem.documentDirectory}dataset/`;
const INDEX_PATH = `${DATASET_DIR}index.json`;

export const ensureDatasetDir = async () => {
  const info = await FileSystem.getInfoAsync(DATASET_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DATASET_DIR, { intermediates: true });
  }
};

export const loadDatasetIndex = async (): Promise<DatasetSample[]> => {
  try {
    const info = await FileSystem.getInfoAsync(INDEX_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(INDEX_PATH);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as DatasetSample[];
    return [];
  } catch {
    return [];
  }
};

export const saveDatasetIndex = async (samples: DatasetSample[]) => {
  await ensureDatasetDir();
  await FileSystem.writeAsStringAsync(INDEX_PATH, JSON.stringify(samples, null, 2));
};

export const appendDatasetSample = async (sample: DatasetSample) => {
  const samples = await loadDatasetIndex();
  samples.push(sample);
  await saveDatasetIndex(samples);
  return samples.length;
};

export const removeDatasetSample = async (id: string) => {
  const samples = await loadDatasetIndex();
  const next = samples.filter((sample) => sample.id !== id);
  await saveDatasetIndex(next);
  return next.length;
};

export const getDatasetDir = () => DATASET_DIR;
