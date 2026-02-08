import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface CameraSettings {
  centerX: number; // normalized 0..1
  centerY: number; // normalized 0..1
  rotationDeg: number; // degrees
  scale: number; // radius scale
  zoom: number; // 0..1
  pictureSize?: string;
  calibrationPoints?: { x: number; y: number }[]; // 4-point calibration (normalized)
}

interface CameraSettingsState {
  settings: CameraSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<CameraSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

const STORAGE_KEY = 'dartsmind.cameraSettings';

const DEFAULT_SETTINGS: CameraSettings = {
  centerX: 0.5,
  centerY: 0.5,
  rotationDeg: 0,
  scale: 1,
  zoom: 0,
};

export const useCameraSettingsStore = create<CameraSettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      set({ settings: DEFAULT_SETTINGS, loaded: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CameraSettings;
      set({ settings: { ...DEFAULT_SETTINGS, ...parsed }, loaded: true });
    } catch {
      set({ settings: DEFAULT_SETTINGS, loaded: true });
    }
  },
  update: async (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
  reset: async () => {
    set({ settings: DEFAULT_SETTINGS });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  },
}));
