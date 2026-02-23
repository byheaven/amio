import {
  ChatApiRequest,
  ChatApiResponse,
  ChatMessage,
  ChatQuotaInfo,
  ConfirmBuildApiRequest,
  ConfirmBuildApiResponse,
  WorldContextForPrompt,
} from './types';

// TARO_APP_API_URL is injected at build time via Taro's defineConstants.
// - Dev: proxied automatically (empty string, see config/dev.ts proxy)
// - Production: set TARO_APP_API_URL=https://your-api-server.com at build time
// The key itself NEVER lives in frontend code — it stays on the backend server.
declare const TARO_APP_API_URL: string | undefined;
const SERVER_BASE_URL: string = (typeof TARO_APP_API_URL !== 'undefined' && TARO_APP_API_URL)
  ? TARO_APP_API_URL
  : '';
const MAX_HISTORY_ROUNDS = 8;
const MAX_DAILY_BUILDS = 3;
const USER_ID_STORAGE_KEY = 'amio_world_user_id';

let messageIdCounter = 0;
const newId = (): string => {
  messageIdCounter += 1;
  return `msg-${Date.now()}-${messageIdCounter}`;
};

const buildLocalDateKey = (date: Date): string => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

const clampUsage = (value: number): number => (
  Math.max(0, Math.min(MAX_DAILY_BUILDS, value))
);

const createUserId = (): string => (
  `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
);

interface DailyUsage {
  dateKey: string;
  used: number;
}

export class ChatService {
  private readonly conversationHistories = new Map<string, ChatMessage[]>();
  private readonly dailyBuildUsage = new Map<string, DailyUsage>();
  private cachedUserId: string | null = null;

  public getHistory(agentId: string): ChatMessage[] {
    return this.conversationHistories.get(agentId) ?? [];
  }

  public getUserId(): string {
    if (this.cachedUserId) {
      return this.cachedUserId;
    }

    const stored = this.readStorageValue(USER_ID_STORAGE_KEY);
    if (stored) {
      this.cachedUserId = stored;
      return stored;
    }

    const newUserId = createUserId();
    this.cachedUserId = newUserId;
    this.writeStorageValue(USER_ID_STORAGE_KEY, newUserId);
    return newUserId;
  }

  public getClientDateKey(): string {
    return buildLocalDateKey(new Date());
  }

  public getDailyBuildCount(userId: string): number {
    return this.getOrCreateUsage(userId, this.getClientDateKey()).used;
  }

  public syncDailyBuildCount(userId: string, clientDateKey: string, usedBuilds: number): void {
    this.dailyBuildUsage.set(userId, {
      dateKey: clientDateKey,
      used: clampUsage(usedBuilds),
    });
  }

  public recordAcceptedBuild(userId: string): void {
    const usage = this.getOrCreateUsage(userId, this.getClientDateKey());
    usage.used = clampUsage(usage.used + 1);
    this.dailyBuildUsage.set(userId, usage);
  }

  public async sendMessage(
    agentId: string,
    userMessage: string,
    worldContext: WorldContextForPrompt,
    userId: string,
    clientDateKey: string,
  ): Promise<ChatApiResponse> {
    const history = this.getHistory(agentId);
    const buildCount = this.getDailyBuildCount(userId);

    const contextWithCount: WorldContextForPrompt = {
      ...worldContext,
      userDailyBuildCount: buildCount,
      userId,
    };

    const apiRequest: ChatApiRequest = {
      agentId,
      message: userMessage,
      userId,
      clientDateKey,
      worldContext: contextWithCount,
      history: history.map((m) => ({ role: m.role, content: m.content })).slice(-MAX_HISTORY_ROUNDS * 2),
    };

    const userMsg: ChatMessage = {
      id: newId(),
      role: 'user',
      content: userMessage,
      timestampMs: Date.now(),
    };
    this.appendMessage(agentId, userMsg);

    let response: ChatApiResponse;
    try {
      const httpResponse = await fetch(`${SERVER_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequest),
      });

      if (!httpResponse.ok) {
        throw new Error(`HTTP ${httpResponse.status}`);
      }

      const parsed = await httpResponse.json() as Partial<ChatApiResponse>;
      response = {
        reply: typeof parsed.reply === 'string'
          ? parsed.reply
          : 'Network response format error. Please try again.',
        action: parsed.action ?? null,
        quota: this.normalizeQuota(parsed.quota, userId, clientDateKey),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ChatService] request failed:', errorMsg);
      response = {
        reply: '网络好像有点问题，稍后再试吧~ (Network error, please try again!)',
        action: null,
        quota: this.getLocalQuota(userId, clientDateKey),
      };
    }

    const assistantMsg: ChatMessage = {
      id: newId(),
      role: 'assistant',
      content: response.reply,
      timestampMs: Date.now(),
    };
    this.appendMessage(agentId, assistantMsg);

    this.syncDailyBuildCount(userId, clientDateKey, response.quota.usedBuilds);

    return response;
  }

  public async confirmBuildAccepted(
    userId: string,
    clientDateKey: string,
    pendingBuildToken: string,
  ): Promise<ConfirmBuildApiResponse> {
    const requestBody: ConfirmBuildApiRequest = {
      userId,
      clientDateKey,
      pendingBuildToken,
    };

    const httpResponse = await fetch(`${SERVER_BASE_URL}/api/confirm-build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!httpResponse.ok) {
      throw new Error(`HTTP ${httpResponse.status}`);
    }

    const parsed = await httpResponse.json() as Partial<ConfirmBuildApiResponse>;
    const response: ConfirmBuildApiResponse = {
      success: parsed.success === true,
      tokenStatus: parsed.tokenStatus === 'already_confirmed' ? 'already_confirmed' : 'accepted',
      quota: this.normalizeQuota(parsed.quota, userId, clientDateKey),
    };

    this.syncDailyBuildCount(userId, clientDateKey, response.quota.usedBuilds);
    return response;
  }

  public clearHistory(agentId: string): void {
    this.conversationHistories.delete(agentId);
  }

  public getRemainingBuilds(userId: string): number {
    return Math.max(0, MAX_DAILY_BUILDS - this.getDailyBuildCount(userId));
  }

  private appendMessage(agentId: string, message: ChatMessage): void {
    const history = this.conversationHistories.get(agentId) ?? [];
    history.push(message);

    if (history.length > MAX_HISTORY_ROUNDS * 2) {
      history.splice(0, history.length - MAX_HISTORY_ROUNDS * 2);
    }

    this.conversationHistories.set(agentId, history);
  }

  private getOrCreateUsage(userId: string, clientDateKey: string): DailyUsage {
    const existing = this.dailyBuildUsage.get(userId);
    if (!existing || existing.dateKey !== clientDateKey) {
      const reset: DailyUsage = { dateKey: clientDateKey, used: 0 };
      this.dailyBuildUsage.set(userId, reset);
      return reset;
    }
    return existing;
  }

  private getLocalQuota(userId: string, clientDateKey: string): ChatQuotaInfo {
    const localUsage = this.getOrCreateUsage(userId, clientDateKey).used;
    return {
      usedBuilds: localUsage,
      remainingBuilds: Math.max(0, MAX_DAILY_BUILDS - localUsage),
    };
  }

  private normalizeQuota(
    quota: ChatQuotaInfo | undefined,
    userId: string,
    clientDateKey: string,
  ): ChatQuotaInfo {
    if (!quota || typeof quota.usedBuilds !== 'number' || typeof quota.remainingBuilds !== 'number') {
      return this.getLocalQuota(userId, clientDateKey);
    }

    const usedBuilds = clampUsage(quota.usedBuilds);
    const normalized: ChatQuotaInfo = {
      usedBuilds,
      remainingBuilds: Math.max(0, MAX_DAILY_BUILDS - usedBuilds),
    };

    if (typeof quota.pendingBuildToken === 'string' && quota.pendingBuildToken) {
      normalized.pendingBuildToken = quota.pendingBuildToken;
    }

    return normalized;
  }

  private readStorageValue(key: string): string | null {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      const value = localStorage.getItem(key);
      return value && value.length > 0 ? value : null;
    } catch (error) {
      console.error('[ChatService] failed to read local storage:', error);
      return null;
    }
  }

  private writeStorageValue(key: string, value: string): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[ChatService] failed to write local storage:', error);
    }
  }
}
