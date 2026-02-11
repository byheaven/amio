import Taro from '@tarojs/taro';

const GAME_LOG_KEY = 'amio_game_session_logs_v1';

export interface GameSessionLog {
  userId: string;
  date: string;
  gameType: string;
  mode: 'normal' | 'hero';
  result: 'cleared' | 'failed' | 'quit';
  attempts: number;
  durationSeconds: number;
  toolsUsed: number;
  chestLevel: 'diamond' | 'gold' | 'silver' | 'bronze';
  heroAttempted: boolean;
  heroResult?: 'cleared' | 'failed';
  feedback?: 'liked' | 'disliked' | 'skipped';
}

const loadLogs = (): GameSessionLog[] => {
  try {
    const raw = Taro.getStorageSync(GAME_LOG_KEY);
    return raw ? (JSON.parse(raw) as GameSessionLog[]) : [];
  } catch (error) {
    console.error('Failed to load game logs:', error);
    return [];
  }
};

const saveLogs = (logs: GameSessionLog[]): void => {
  try {
    Taro.setStorageSync(GAME_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save game logs:', error);
  }
};

export const gameLogger = {
  append(log: GameSessionLog): void {
    const logs = loadLogs();
    logs.push(log);
    saveLogs(logs);
  },

  listByUser(userId: string): GameSessionLog[] {
    return loadLogs().filter((item) => item.userId === userId);
  },

  clear(): void {
    try {
      Taro.removeStorageSync(GAME_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear game logs:', error);
    }
  },

  storageKey: GAME_LOG_KEY,
};
