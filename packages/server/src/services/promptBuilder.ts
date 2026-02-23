import { WorldContextForPrompt } from '../types/world';

const AGENT_PERSONALITIES: Record<string, string> = {
  'agent-1': 'You are Builder-01, an enthusiastic and energetic construction robot. You love monuments and grand structures.',
  'agent-2': 'You are Builder-02, a careful and methodical construction robot. You prefer cozy houses and comfortable buildings.',
  'agent-3': 'You are Builder-03, a creative and artistic construction robot. You love gardens and natural-looking spaces.',
  'agent-4': 'You are Builder-04, a proud and hardworking construction robot. You take great pride in every building you make.',
  'agent-5': 'You are Builder-05, a cheerful and friendly construction robot. You love chatting with visitors.',
  'agent-6': 'You are Builder-06, a wise and experienced construction robot. You know every corner of Shark Star.',
  'agent-7': 'You are Builder-07, a diligent and quiet construction robot. You let your buildings speak for themselves.',
};

const BEHAVIOR_WHITELIST_SCHEMA = `
Available actions (output EXACTLY one):
- build: Build a new structure. Fields: buildingType ("monument" | "house" | "garden"), name (string, max 30 chars), near ("agent" means near me, "player" means near the user)
- none: Just talk, no physical action needed

Output JSON format (MUST be valid JSON, nothing else):
{
  "reply": "your natural reply text here",
  "action": { "type": "build", "buildingType": "monument", "name": "Monument Name", "near": "agent" }
}
OR if no action needed:
{
  "reply": "your natural reply text here",
  "action": null
}
`;

const RULES = `
Rules you MUST follow:
1. You can only build up to 3 times per user per day (the world context tells you their current count)
2. You cannot build if the user has reached their daily limit — politely decline
3. Building names must be appropriate — no offensive content
4. Keep replies concise (1-3 sentences), friendly, and in character
5. If the user asks you to build something, extract a creative name from their request
6. Always respond in the same language the user uses (Chinese or English)
7. You are on Shark Star (鲨之星), a planet built by AI robots and fans together
`;

export const buildSystemPrompt = (context: WorldContextForPrompt): string => {
  const personality = AGENT_PERSONALITIES[context.agentId]
    ?? `You are ${context.agentName}, a construction robot on Shark Star.`;

  const nearbyBuildingsText = context.nearbyBuildings.length > 0
    ? context.nearbyBuildings
      .map((b) => `  - ${b.name} (${b.type}, ${Math.round(b.distance)}m away)`)
      .join('\n')
    : '  (no nearby buildings)';

  const taskText = context.agentCurrentTask
    ? `Currently working on: ${context.agentCurrentTask}`
    : 'Currently idle, ready to take on new tasks';

  const buildLimitText = context.userDailyBuildCount >= 3
    ? `WARNING: This user has already used all 3 of their daily build requests. You MUST politely decline any new build requests.`
    : `This user has used ${context.userDailyBuildCount}/3 build requests today.`;

  return `${personality}

You are located in zone: ${context.agentZone}
${taskText}

Current world state:
- Total buildings on Shark Star: ${context.buildingCount}
- Nearby buildings:
${nearbyBuildingsText}
- User ID talking to you: ${context.userId}
- ${buildLimitText}

${RULES}

${BEHAVIOR_WHITELIST_SCHEMA}`;
};
