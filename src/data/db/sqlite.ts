import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('dartsmind.db');
  }
  return dbPromise;
};

export const initDb = async () => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY NOT NULL,
      mode TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stats (
      id TEXT PRIMARY KEY NOT NULL,
      matchId TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `);
};
