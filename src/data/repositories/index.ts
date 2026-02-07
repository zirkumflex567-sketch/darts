import { Platform } from 'react-native';
import { MatchRepository, StatsRepository } from './types';
import { SQLiteMatchRepository } from './SQLiteMatchRepository';
import { SQLiteStatsRepository } from './SQLiteStatsRepository';
import { LocalStorageMatchRepository } from './LocalStorageMatchRepository';
import { LocalStorageStatsRepository } from './LocalStorageStatsRepository';

export const createMatchRepository = (): MatchRepository => {
  if (Platform.OS === 'web') {
    return new LocalStorageMatchRepository();
  }
  return new SQLiteMatchRepository();
};

export const createStatsRepository = (): StatsRepository => {
  if (Platform.OS === 'web') {
    return new LocalStorageStatsRepository();
  }
  return new SQLiteStatsRepository();
};
