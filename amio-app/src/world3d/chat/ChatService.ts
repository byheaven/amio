import { ChatMessage, ChatApiRequest, ChatApiResponse, WorldContextForPrompt } from './types';

const SERVER_BASE_URL = process.env.TARO_APP_API_URL ?? 'http://localhost:3001';
const MAX_HISTORY_ROUNDS = 8;
const MAX_DAILY_BUILDS = 3;

let messageIdCounter = 0;
const newId = (): string => {
  messageIdCounter += 1;
  return `msg-${Date.now()}-${messageIdCounter}`;
};

export class ChatService {
  private readonly conversationHistories = new Map<string, ChatMessage[]>();
  private readonly dailyBuildCounts = new Map<string, number>();

  public getHistory(agentId: string): ChatMessage[] {
    return this.conversationHistories.get(agentId) ?? [];
  }

  public getDailyBuildCount(agentId: string): number {
    return this.dailyBuildCounts.get(agentId) ?? 0;
  }

  public async sendMessage(
    agentId: string,
    userMessage: string,
    worldContext: WorldContextForPrompt,
  ): Promise<ChatApiResponse> {
    const history = this.getHistory(agentId);
    const buildCount = this.getDailyBuildCount(agentId);

    const contextWithCount: WorldContextForPrompt = {
      ...worldContext,
      userDailyBuildCount: buildCount,
    };

    const apiRequest: ChatApiRequest = {
      agentId,
      message: userMessage,
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

      response = await httpResponse.json() as ChatApiResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ChatService] request failed:', errorMsg);
      response = {
        reply: '网络好像有点问题，稍后再试吧~ (Network error, please try again!)',
        action: null,
      };
    }

    const assistantMsg: ChatMessage = {
      id: newId(),
      role: 'assistant',
      content: response.reply,
      timestampMs: Date.now(),
    };
    this.appendMessage(agentId, assistantMsg);

    if (response.action?.type === 'build') {
      this.incrementDailyBuildCount(agentId);
    }

    return response;
  }

  public clearHistory(agentId: string): void {
    this.conversationHistories.delete(agentId);
  }

  public getRemainingBuilds(agentId: string): number {
    return Math.max(0, MAX_DAILY_BUILDS - this.getDailyBuildCount(agentId));
  }

  private appendMessage(agentId: string, message: ChatMessage): void {
    const history = this.conversationHistories.get(agentId) ?? [];
    history.push(message);

    if (history.length > MAX_HISTORY_ROUNDS * 2) {
      history.splice(0, history.length - MAX_HISTORY_ROUNDS * 2);
    }

    this.conversationHistories.set(agentId, history);
  }

  private incrementDailyBuildCount(agentId: string): void {
    const current = this.dailyBuildCounts.get(agentId) ?? 0;
    this.dailyBuildCounts.set(agentId, current + 1);
  }
}
