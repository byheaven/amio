import { AgentAction, BuildingType, WorldContextForPrompt } from '../types/world';

const VALID_BUILDING_TYPES = new Set<BuildingType>(['monument', 'house', 'garden']);
const VALID_ACTION_TYPES = new Set(['build', 'move_to', 'none']);
const MAX_DAILY_BUILDS = 3;
const MAX_NAME_LENGTH = 30;

const BANNED_WORDS = [
  '操', '妈', '傻', '逼', '滚', '死', '烂', '垃圾', '废物', '白痴',
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'bastard',
];

const containsBannedWord = (text: string): boolean => {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((word) => lower.includes(word));
};

export interface ValidationResult {
  valid: boolean;
  action: AgentAction | null;
  overrideReply?: string;
}

export const validateAction = (
  action: AgentAction | null,
  context: WorldContextForPrompt,
): ValidationResult => {
  if (!action || action.type === 'none') {
    return { valid: true, action: null };
  }

  if (!VALID_ACTION_TYPES.has(action.type)) {
    return { valid: false, action: null };
  }

  if (action.type === 'move_to') {
    return { valid: true, action };
  }

  if (action.type === 'build') {
    if (context.userDailyBuildCount >= MAX_DAILY_BUILDS) {
      return {
        valid: false,
        action: null,
        overrideReply: '今天的建造次数用完了，明天再来吧~ (Today\'s build quota is used up, come back tomorrow!)',
      };
    }

    if (!VALID_BUILDING_TYPES.has(action.buildingType)) {
      return { valid: false, action: null };
    }

    const trimmedName = action.name?.trim() ?? '';
    if (!trimmedName) {
      return {
        valid: false,
        action: null,
        overrideReply: '需要给建筑起个名字才能建造哦！(I need a name for the building!)',
      };
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return {
        valid: false,
        action: null,
        overrideReply: `名字太长了，最多${MAX_NAME_LENGTH}个字符~ (Name too long, max ${MAX_NAME_LENGTH} characters!)`,
      };
    }

    if (containsBannedWord(trimmedName)) {
      return {
        valid: false,
        action: null,
        overrideReply: '这个名字不太合适，换一个吧~ (That name isn\'t quite right, try another!)',
      };
    }

    return {
      valid: true,
      action: {
        type: 'build',
        buildingType: action.buildingType,
        name: trimmedName,
        near: action.near ?? 'agent',
      },
    };
  }

  return { valid: false, action: null };
};

export const parseLlmResponse = (rawContent: string): { reply: string; action: AgentAction | null } => {
  let parsed: { reply?: string; action?: AgentAction | null } | null = null;

  try {
    parsed = JSON.parse(rawContent) as { reply?: string; action?: AgentAction | null };
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]) as { reply?: string; action?: AgentAction | null };
      } catch {
        // Fall through to text-only fallback
      }
    }
  }

  if (parsed && typeof parsed.reply === 'string') {
    return {
      reply: parsed.reply,
      action: parsed.action ?? null,
    };
  }

  return {
    reply: rawContent.slice(0, 500) || '好的，我明白了！(Got it!)',
    action: null,
  };
};
