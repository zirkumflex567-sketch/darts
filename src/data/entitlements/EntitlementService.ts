import AsyncStorage from '@react-native-async-storage/async-storage';

export type EntitlementKey = 'premium_training' | 'online_video' | 'advanced_stats';

export interface Entitlements {
  [key: string]: boolean;
}

const STORAGE_KEY = 'dartsmind.entitlements';

export const loadEntitlements = async (): Promise<Entitlements> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      premium_training: false,
      online_video: false,
      advanced_stats: false,
    };
  }
  try {
    return JSON.parse(raw) as Entitlements;
  } catch {
    return {
      premium_training: false,
      online_video: false,
      advanced_stats: false,
    };
  }
};

export const setEntitlement = async (key: EntitlementKey, value: boolean) => {
  const current = await loadEntitlements();
  const next = { ...current, [key]: value };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const isEntitled = async (key: EntitlementKey) => {
  const current = await loadEntitlements();
  return !!current[key];
};
