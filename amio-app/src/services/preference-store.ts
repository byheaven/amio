import Taro from '@tarojs/taro';
import { FeedbackValue } from '@/engine/types';

const PREFERENCE_KEY = 'amio_preference_records_v1';

export interface PreferenceRecord {
  userId: string;
  date: string;
  gameType: string;
  feedback: FeedbackValue;
}

const loadRecords = (): PreferenceRecord[] => {
  try {
    const raw = Taro.getStorageSync(PREFERENCE_KEY);
    return raw ? (JSON.parse(raw) as PreferenceRecord[]) : [];
  } catch (error) {
    console.error('Failed to load preference records:', error);
    return [];
  }
};

const saveRecords = (records: PreferenceRecord[]): void => {
  try {
    Taro.setStorageSync(PREFERENCE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save preference records:', error);
  }
};

export const preferenceStore = {
  save(record: PreferenceRecord): void {
    const records = loadRecords();
    const filtered = records.filter(
      (item) => !(item.userId === record.userId && item.date === record.date && item.gameType === record.gameType)
    );
    filtered.push(record);
    saveRecords(filtered);
  },

  listByUser(userId: string): PreferenceRecord[] {
    return loadRecords().filter((item) => item.userId === userId);
  },

  clear(): void {
    try {
      Taro.removeStorageSync(PREFERENCE_KEY);
    } catch (error) {
      console.error('Failed to clear preference records:', error);
    }
  },

  storageKey: PREFERENCE_KEY,
};
