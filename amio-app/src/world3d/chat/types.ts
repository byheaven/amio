import { BuildingType } from '../buildings/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestampMs: number;
}

export type AgentAction =
  | { type: 'build'; buildingType: BuildingType; name: string; near: 'agent' | 'player' }
  | { type: 'move_to'; target: string }
  | { type: 'none' };

export interface ChatApiRequest {
  agentId: string;
  message: string;
  userId: string;
  clientDateKey: string;
  worldContext: WorldContextForPrompt;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatQuotaInfo {
  usedBuilds: number;
  remainingBuilds: number;
  pendingBuildToken?: string;
}

export interface ChatApiResponse {
  reply: string;
  action: AgentAction | null;
  quota: ChatQuotaInfo;
}

export interface ConfirmBuildApiRequest {
  userId: string;
  clientDateKey: string;
  pendingBuildToken: string;
}

export interface ConfirmBuildApiResponse {
  success: boolean;
  tokenStatus: 'accepted' | 'already_confirmed';
  quota: ChatQuotaInfo;
}

export interface WorldContextForPrompt {
  agentId: string;
  agentName: string;
  agentZone: string;
  agentCurrentTask: string | null;
  buildingCount: number;
  nearbyBuildings: Array<{ name: string; type: BuildingType; distance: number }>;
  userDailyBuildCount: number;
  userId: string;
}
