export type BuildingType = 'monument' | 'house' | 'garden';
export type BuilderAgentMode = 'idle' | 'patrol' | 'building';

export interface Vector3JSON {
  x: number;
  y: number;
  z: number;
}

export interface AgentStateJSON {
  id: string;
  name: string;
  position: Vector3JSON;
  rotationY: number;
  mode: BuilderAgentMode;
  statusText: string;
  taskId?: string;
  buildProgress?: number;
}

export interface BuildingStateJSON {
  id: string;
  type: BuildingType;
  name: string;
  position: Vector3JSON;
  rotationY: number;
  progress: number;
  status: 'building' | 'complete';
  createdAtMs: number;
  requestedBy: string;
}

export interface WorldStateJSON {
  version: 1;
  agents: AgentStateJSON[];
  buildings: BuildingStateJSON[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

export interface ChatRequest {
  agentId: string;
  message: string;
  worldContext: WorldContextForPrompt;
  history: ChatMessage[];
}

export type AgentAction =
  | { type: 'build'; buildingType: BuildingType; name: string; near: 'agent' | 'player' }
  | { type: 'move_to'; target: string }
  | { type: 'none' };

export interface ChatResponse {
  reply: string;
  action: AgentAction | null;
}
