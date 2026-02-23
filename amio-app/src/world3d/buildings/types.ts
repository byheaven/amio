import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type BuildingType = 'monument' | 'house' | 'garden';

export interface BuildingInstance {
  id: string;
  type: BuildingType;
  name: string;
  position: Vector3;
  rotationY: number;
  progress: number;
  status: 'building' | 'complete';
  createdAtMs: number;
  requestedBy: string;
}

export interface BuildingSnapshot {
  id: string;
  type: BuildingType;
  name: string;
  position: Vector3;
  rotationY: number;
  progress: number;
  status: 'building' | 'complete';
  createdAtMs: number;
  requestedBy: string;
}

export interface CreateBuildingRequest {
  type: BuildingType;
  name: string;
  position: Vector3;
  rotationY?: number;
  requestedBy?: string;
}
