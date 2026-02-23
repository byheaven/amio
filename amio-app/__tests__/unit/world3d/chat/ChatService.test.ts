import { ChatService } from '@/world3d/chat/ChatService';
import { WorldContextForPrompt } from '@/world3d/chat/types';

const createWorldContext = (userId: string): WorldContextForPrompt => ({
  agentId: 'agent-1',
  agentName: 'Builder-01',
  agentZone: 'Central Zone',
  agentCurrentTask: null,
  buildingCount: 0,
  nearbyBuildings: [],
  userDailyBuildCount: 0,
  userId,
});

describe('ChatService quota and identity behavior', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-23T09:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  test('persists user id across service instances', () => {
    const firstService = new ChatService();
    const firstUserId = firstService.getUserId();

    const secondService = new ChatService();
    const secondUserId = secondService.getUserId();

    expect(secondUserId).toBe(firstUserId);
  });

  test('resets daily build count when the local date changes', () => {
    const service = new ChatService();
    const userId = 'user-rollover';

    service.recordAcceptedBuild(userId);
    expect(service.getDailyBuildCount(userId)).toBe(1);

    jest.setSystemTime(new Date('2026-02-24T00:10:00'));
    expect(service.getDailyBuildCount(userId)).toBe(0);
  });

  test('does not consume quota on chat build action before assignment confirmation', async () => {
    const service = new ChatService();
    const userId = 'user-no-preconsume';
    const clientDateKey = '2026-02-23';
    const context = createWorldContext(userId);

    global.fetch = jest.fn().mockResolvedValue(
      {
        ok: true,
        status: 200,
        json: async () => ({
          reply: 'I can build that for you.',
          action: {
            type: 'build',
            buildingType: 'monument',
            name: 'Test Monument',
            near: 'agent',
          },
          quota: {
            usedBuilds: 0,
            remainingBuilds: 3,
            pendingBuildToken: 'token-123',
          },
        }),
      } as Response,
    ) as typeof fetch;

    const response = await service.sendMessage('agent-1', 'Please build it.', context, userId, clientDateKey);

    expect(response.action?.type).toBe('build');
    expect(response.quota.pendingBuildToken).toBe('token-123');
    expect(service.getDailyBuildCount(userId)).toBe(0);
  });

  test('syncs local quota after build confirmation response', async () => {
    const service = new ChatService();
    const userId = 'user-confirm-sync';
    const clientDateKey = '2026-02-23';

    global.fetch = jest.fn().mockResolvedValue(
      {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          tokenStatus: 'accepted',
          quota: {
            usedBuilds: 1,
            remainingBuilds: 2,
          },
        }),
      } as Response,
    ) as typeof fetch;

    const response = await service.confirmBuildAccepted(userId, clientDateKey, 'token-456');

    expect(response.success).toBe(true);
    expect(response.tokenStatus).toBe('accepted');
    expect(service.getDailyBuildCount(userId)).toBe(1);
    expect(service.getRemainingBuilds(userId)).toBe(2);
  });
});
