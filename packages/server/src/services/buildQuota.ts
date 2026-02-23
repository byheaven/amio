import { ChatQuota } from '../types/world';

const MAX_DAILY_BUILDS = 3;
const QUOTA_KEY_PREFIX = 'chat:quota';
const PENDING_BUILD_KEY_PREFIX = 'chat:pending-build';
const PENDING_BUILD_TOKEN_TTL_SECONDS = 30 * 60;
const CONSUMED_TOKEN_TTL_SECONDS = 24 * 60 * 60;

interface PendingBuildTokenRecord {
  userId: string;
  clientDateKey: string;
  consumed: boolean;
  createdAtMs: number;
  consumedAtMs?: number;
}

interface ConfirmPendingTokenResult {
  status: 'accepted' | 'already_confirmed' | 'invalid_token' | 'invalid_owner';
  quota: ChatQuota;
}

const USER_ID_MAX_LENGTH = 128;
const CLIENT_DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const sanitizeKeyPart = (value: string): string => encodeURIComponent(value);

const buildQuotaKey = (userId: string, clientDateKey: string): string => (
  `${QUOTA_KEY_PREFIX}:${sanitizeKeyPart(userId)}:${clientDateKey}`
);

const buildPendingTokenKey = (token: string): string => (
  `${PENDING_BUILD_KEY_PREFIX}:${token}`
);

const parseCount = (raw: string | null): number => {
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const toQuota = (usedBuilds: number, pendingBuildToken?: string): ChatQuota => {
  const quota: ChatQuota = {
    usedBuilds,
    remainingBuilds: Math.max(0, MAX_DAILY_BUILDS - usedBuilds),
  };

  if (pendingBuildToken) {
    quota.pendingBuildToken = pendingBuildToken;
  }

  return quota;
};

const isValidCalendarDate = (clientDateKey: string): boolean => {
  const [yearText, monthText, dayText] = clientDateKey.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day
  );
};

export const validateUserId = (userId: string): boolean => (
  userId.length > 0 && userId.length <= USER_ID_MAX_LENGTH
);

export const validateClientDateKey = (clientDateKey: string): boolean => (
  CLIENT_DATE_KEY_REGEX.test(clientDateKey) && isValidCalendarDate(clientDateKey)
);

export const getDailyBuildUsage = async (
  kv: KVNamespace,
  userId: string,
  clientDateKey: string,
): Promise<number> => {
  const key = buildQuotaKey(userId, clientDateKey);
  const raw = await kv.get(key);
  const parsed = parseCount(raw);
  return Math.min(parsed, MAX_DAILY_BUILDS);
};

const setDailyBuildUsage = async (
  kv: KVNamespace,
  userId: string,
  clientDateKey: string,
  usage: number,
): Promise<void> => {
  const key = buildQuotaKey(userId, clientDateKey);
  const clamped = Math.max(0, Math.min(MAX_DAILY_BUILDS, usage));
  await kv.put(key, String(clamped), { expirationTtl: CONSUMED_TOKEN_TTL_SECONDS });
};

export const quotaFromUsage = (usedBuilds: number, pendingBuildToken?: string): ChatQuota => (
  toQuota(Math.max(0, Math.min(MAX_DAILY_BUILDS, usedBuilds)), pendingBuildToken)
);

export const createPendingBuildToken = async (
  kv: KVNamespace,
  userId: string,
  clientDateKey: string,
): Promise<string> => {
  const token = crypto.randomUUID();
  const tokenKey = buildPendingTokenKey(token);
  const record: PendingBuildTokenRecord = {
    userId,
    clientDateKey,
    consumed: false,
    createdAtMs: Date.now(),
  };

  await kv.put(tokenKey, JSON.stringify(record), { expirationTtl: PENDING_BUILD_TOKEN_TTL_SECONDS });
  return token;
};

export const confirmPendingBuildToken = async (
  kv: KVNamespace,
  userId: string,
  clientDateKey: string,
  token: string,
): Promise<ConfirmPendingTokenResult> => {
  const tokenKey = buildPendingTokenKey(token);
  const rawToken = await kv.get(tokenKey);
  const currentUsage = await getDailyBuildUsage(kv, userId, clientDateKey);

  if (!rawToken) {
    return {
      status: 'invalid_token',
      quota: toQuota(currentUsage),
    };
  }

  let parsedToken: PendingBuildTokenRecord | null = null;
  try {
    parsedToken = JSON.parse(rawToken) as PendingBuildTokenRecord;
  } catch {
    return {
      status: 'invalid_token',
      quota: toQuota(currentUsage),
    };
  }

  if (
    !parsedToken
    || parsedToken.userId !== userId
    || parsedToken.clientDateKey !== clientDateKey
  ) {
    return {
      status: 'invalid_owner',
      quota: toQuota(currentUsage),
    };
  }

  if (parsedToken.consumed) {
    return {
      status: 'already_confirmed',
      quota: toQuota(currentUsage),
    };
  }

  const nextUsage = Math.min(MAX_DAILY_BUILDS, currentUsage + 1);
  await setDailyBuildUsage(kv, userId, clientDateKey, nextUsage);

  const consumedToken: PendingBuildTokenRecord = {
    ...parsedToken,
    consumed: true,
    consumedAtMs: Date.now(),
  };

  await kv.put(tokenKey, JSON.stringify(consumedToken), { expirationTtl: CONSUMED_TOKEN_TTL_SECONDS });

  return {
    status: 'accepted',
    quota: toQuota(nextUsage),
  };
};
