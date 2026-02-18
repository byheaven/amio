import { BuildingType } from '../buildings/types';
import { BuilderAgentMode } from '../agents/types';

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
  requestedBy: 'system';
}

export interface WorldStateJSON {
  version: 1;
  agents: AgentStateJSON[];
  buildings: BuildingStateJSON[];
}
