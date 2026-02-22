import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { BuildingType } from '../buildings/types';

export interface BuildTask {
  id: string;
  type: BuildingType;
  name: string;
  position: Vector3;
  rotationY?: number;
  requestedBy?: string;
}

export type BuilderAgentMode = 'idle' | 'patrol' | 'building';

export interface BuilderAgentTickContext {
  deltaSeconds: number;
  nowMs: number;
}

export interface BuilderAgentSnapshot {
  id: string;
  name: string;
  position: Vector3;
  rotationY: number;
  mode: BuilderAgentMode;
  statusText: string;
  taskId?: string;
  buildProgress?: number;
}
