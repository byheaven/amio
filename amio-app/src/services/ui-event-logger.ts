import Taro from '@tarojs/taro';

const UI_EVENT_LOG_KEY = 'amio_ui_event_logs_v1';

export type UIEventName =
  | 'starlight_cta_exposed'
  | 'starlight_cta_clicked'
  | 'game_started'
  | 'game_cleared'
  | 'game_failed'
  | 'hero_prompt_shown'
  | 'hero_prompt_clicked';

export type UIEventMetadataValue = string | number | boolean | null;

export interface UIEvent {
  id: string;
  userId: string;
  date: string;
  event: UIEventName;
  timestamp: number;
  metadata?: Record<string, UIEventMetadataValue>;
}

interface AppendUIEventInput {
  userId: string;
  date: string;
  event: UIEventName;
  metadata?: Record<string, UIEventMetadataValue>;
}

const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const hasStorageReader = (): boolean => {
  return typeof Taro.getStorageSync === 'function';
};

const hasStorageWriter = (): boolean => {
  return typeof Taro.setStorageSync === 'function';
};

const hasStorageRemover = (): boolean => {
  return typeof Taro.removeStorageSync === 'function';
};

const loadEvents = (): UIEvent[] => {
  if (!hasStorageReader()) {
    return [];
  }

  try {
    const raw = Taro.getStorageSync(UI_EVENT_LOG_KEY);
    return raw ? (JSON.parse(raw) as UIEvent[]) : [];
  } catch (error) {
    console.error('Failed to load UI event logs:', error);
    return [];
  }
};

const saveEvents = (events: UIEvent[]): void => {
  if (!hasStorageWriter()) {
    return;
  }

  try {
    Taro.setStorageSync(UI_EVENT_LOG_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save UI event logs:', error);
  }
};

export const uiEventLogger = {
  append(input: AppendUIEventInput): void {
    const events = loadEvents();
    events.push({
      id: generateEventId(),
      userId: input.userId,
      date: input.date,
      event: input.event,
      timestamp: Date.now(),
      metadata: input.metadata,
    });
    saveEvents(events);
  },

  listByUser(userId: string): UIEvent[] {
    return loadEvents().filter((item) => item.userId === userId);
  },

  listByEvent(event: UIEventName): UIEvent[] {
    return loadEvents().filter((item) => item.event === event);
  },

  clear(): void {
    if (!hasStorageRemover()) {
      return;
    }

    try {
      Taro.removeStorageSync(UI_EVENT_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear UI event logs:', error);
    }
  },

  storageKey: UI_EVENT_LOG_KEY,
};
