import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import { createBillboardText, BillboardText } from '../scene/createBillboardText';
import { createBuildingPrefab } from './prefabs';
import {
  BuildingInstance,
  BuildingSnapshot,
  CreateBuildingRequest,
} from './types';

const BUILDING_ALPHA_CONSTRUCTING = 0.36;
const BUILDING_ALPHA_COMPLETE = 1;
const COMPLETION_FX_SECONDS = 0.45;

interface BuildingRuntime {
  data: BuildingInstance;
  root: TransformNode;
  meshes: Mesh[];
  label: BillboardText;
  completionFxRemainingSeconds: number;
}

const clampProgress = (value: number): number => {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const setMeshesAlpha = (meshes: Mesh[], alpha: number): void => {
  meshes.forEach((mesh) => {
    if (mesh.material instanceof StandardMaterial) {
      mesh.material.alpha = alpha;
    }
  });
};

const setMeshesEmissive = (meshes: Mesh[], color: Color3): void => {
  meshes.forEach((mesh) => {
    if (mesh.material instanceof StandardMaterial) {
      mesh.material.emissiveColor.copyFrom(color);
    }
  });
};

const formatProgressText = (name: string, progress: number): string => (
  `${name}\n${Math.round(progress * 100)}%`
);

export class BuildingManager {
  private readonly scene: Scene;
  private readonly runtimes = new Map<string, BuildingRuntime>();
  private idCounter = 0;

  public constructor(scene: Scene) {
    this.scene = scene;
  }

  public createBuildingSite(request: CreateBuildingRequest): string {
    this.idCounter += 1;
    const id = `building-${this.idCounter}`;
    const prefab = createBuildingPrefab(this.scene, request.type, id);

    prefab.root.position.copyFrom(request.position);
    prefab.root.rotation.y = request.rotationY ?? 0;

    const label = createBillboardText(this.scene, `${id}-label`, {
      width: 8,
      height: 3.2,
      font: 'bold 42px "Noto Sans SC", sans-serif',
      textColor: '#ECF6FF',
      backgroundColor: 'rgba(7, 16, 29, 0.65)',
      emissiveColor: new Color3(0.85, 0.92, 1),
      offset: new Vector3(0, 8.2, 0),
      parent: prefab.root,
    });

    const data: BuildingInstance = {
      id,
      type: request.type,
      name: request.name,
      position: request.position.clone(),
      rotationY: request.rotationY ?? 0,
      progress: 0,
      status: 'building',
      createdAtMs: Date.now(),
      requestedBy: request.requestedBy ?? 'system',
    };

    setMeshesAlpha(prefab.meshes, BUILDING_ALPHA_CONSTRUCTING);
    label.setText(formatProgressText(data.name, 0));

    this.runtimes.set(id, {
      data,
      root: prefab.root,
      meshes: prefab.meshes,
      label,
      completionFxRemainingSeconds: 0,
    });

    return id;
  }

  public setProgress(buildingId: string, progress: number): void {
    const runtime = this.runtimes.get(buildingId);
    if (!runtime) {
      return;
    }

    const clampedProgress = clampProgress(progress);
    runtime.data.progress = clampedProgress;

    if (runtime.data.status === 'building') {
      runtime.label.setText(formatProgressText(runtime.data.name, clampedProgress));
      if (clampedProgress >= 1) {
        this.complete(buildingId);
      }
    }
  }

  public complete(buildingId: string): void {
    const runtime = this.runtimes.get(buildingId);
    if (!runtime || runtime.data.status === 'complete') {
      return;
    }

    runtime.data.status = 'complete';
    runtime.data.progress = 1;
    setMeshesAlpha(runtime.meshes, BUILDING_ALPHA_COMPLETE);
    setMeshesEmissive(runtime.meshes, new Color3(0.35, 0.48, 0.62));
    runtime.label.setText(runtime.data.name);
    runtime.completionFxRemainingSeconds = COMPLETION_FX_SECONDS;
  }

  public fixedTick(deltaSeconds: number, nowMs: number): void {
    const pulseFactor = 1 + 0.15 * Math.sin(nowMs / 220);
    this.runtimes.forEach((runtime) => {
      if (runtime.completionFxRemainingSeconds <= 0) {
        return;
      }

      runtime.completionFxRemainingSeconds = Math.max(
        0,
        runtime.completionFxRemainingSeconds - deltaSeconds
      );

      const ratio = runtime.completionFxRemainingSeconds / COMPLETION_FX_SECONDS;
      const emissive = new Color3(
        (0.12 + 0.4 * ratio) * pulseFactor,
        (0.16 + 0.45 * ratio) * pulseFactor,
        (0.2 + 0.5 * ratio) * pulseFactor
      );
      setMeshesEmissive(runtime.meshes, emissive);

      if (runtime.completionFxRemainingSeconds <= 0) {
        setMeshesEmissive(runtime.meshes, new Color3(0, 0, 0));
      }
    });
  }

  public isPositionOccupied(position: Vector3, minDistance = 5): boolean {
    const minDistanceSquared = minDistance * minDistance;
    for (const runtime of this.runtimes.values()) {
      const dx = runtime.data.position.x - position.x;
      const dz = runtime.data.position.z - position.z;
      if (dx * dx + dz * dz <= minDistanceSquared) {
        return true;
      }
    }
    return false;
  }

  public getSnapshots(): BuildingSnapshot[] {
    return Array.from(this.runtimes.values()).map((runtime) => ({
      id: runtime.data.id,
      type: runtime.data.type,
      name: runtime.data.name,
      position: runtime.data.position.clone(),
      rotationY: runtime.data.rotationY,
      progress: runtime.data.progress,
      status: runtime.data.status,
      createdAtMs: runtime.data.createdAtMs,
      requestedBy: runtime.data.requestedBy,
    }));
  }

  public dispose(): void {
    this.runtimes.forEach((runtime) => {
      runtime.label.dispose();
      runtime.root.dispose(false, true);
    });
    this.runtimes.clear();
  }
}
