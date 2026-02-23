import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { AgentManager } from '../agents/AgentManager';
import { BuilderAgent } from '../agents/BuilderAgent';
import { BuildingManager } from '../buildings/BuildingManager';
import { BuildingSnapshot } from '../buildings/types';

export const CHAT_INTERACTION_DISTANCE = 12;
const TAP_MAX_DURATION_MS = 300;
const TAP_MAX_MOVE_PX = 10;

export interface AgentPickResult {
  type: 'agent';
  agent: BuilderAgent;
  agentId: string;
  agentName: string;
  distance: number;
}

export interface BuildingPickResult {
  type: 'building';
  building: BuildingSnapshot;
}

export type PickResult = AgentPickResult | BuildingPickResult;
export type BuildingUnavailableReason = 'under_construction' | 'not_found';
interface InteractiveHitCandidate {
  distance: number;
  meshName: string;
  agentMeshName: string | null;
  buildingMeshName: string | null;
}

const PICK_DEBUG_STORAGE_KEY = 'worldPickDebug';

export interface WorldPickerOptions {
  scene: Scene;
  agentManager: AgentManager;
  buildingManager: BuildingManager;
  getPlayerPosition: () => Vector3 | null;
  getCurrentUserId: () => string;
  onAgentPicked: (result: AgentPickResult) => void;
  onBuildingPicked: (result: BuildingPickResult) => void;
  onBuildingUnavailable: (reason: BuildingUnavailableReason) => void;
  onTooFar: (agentName: string) => void;
  onAgentBusy: (agentName: string) => void;
}

export class WorldPicker {
  private readonly options: WorldPickerOptions;
  private pointerDownTime = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private lastPickHandledAtMs = 0;
  private disposed = false;

  public constructor(options: WorldPickerOptions) {
    this.options = options;
    this.registerEvents();
  }

  public dispose(): void {
    this.disposed = true;
    const canvas = this.options.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointerup', this.onPointerUp);
      canvas.removeEventListener('click', this.onClick);
    }
  }

  private registerEvents(): void {
    const canvas = this.options.scene.getEngine().getRenderingCanvas();
    if (!canvas) {
      return;
    }
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('click', this.onClick);
  }

  private readonly onPointerDown = (evt: PointerEvent): void => {
    this.pointerDownTime = Date.now();
    this.pointerDownX = evt.clientX;
    this.pointerDownY = evt.clientY;
  };

  private readonly onPointerUp = (evt: PointerEvent): void => {
    if (this.disposed) {
      return;
    }

    const elapsed = Date.now() - this.pointerDownTime;
    const dx = Math.abs(evt.clientX - this.pointerDownX);
    const dy = Math.abs(evt.clientY - this.pointerDownY);

    if (elapsed > TAP_MAX_DURATION_MS || dx > TAP_MAX_MOVE_PX || dy > TAP_MAX_MOVE_PX) {
      return;
    }

    this.handlePick(evt.clientX, evt.clientY);
  };

  private readonly onClick = (evt: MouseEvent): void => {
    if (this.disposed) {
      return;
    }

    // Avoid double-trigger when click follows a successful pointerup pick.
    const now = Date.now();
    if (now - this.lastPickHandledAtMs < 150) {
      return;
    }

    this.handlePick(evt.clientX, evt.clientY);
  };

  private handleAgentPick(agent: BuilderAgent): void {
    const playerPos = this.options.getPlayerPosition();
    const agentPos = agent.getPosition();

    const distance = playerPos
      ? Math.sqrt(
        (playerPos.x - agentPos.x) ** 2 + (playerPos.z - agentPos.z) ** 2,
      )
      : Infinity;

    const snapshot = agent.getSnapshot();

    if (distance > CHAT_INTERACTION_DISTANCE) {
      this.options.onTooFar(snapshot.name);
      return;
    }

    if (agent.isInConversation()) {
      const currentUser = agent.getConversationUserId();
      if (currentUser !== this.options.getCurrentUserId()) {
        this.options.onAgentBusy(snapshot.name);
        return;
      }
    }

    this.options.onAgentPicked({
      type: 'agent',
      agent,
      agentId: snapshot.id,
      agentName: snapshot.name,
      distance,
    });
  }

  private handleBuildingPick(meshName: string): void {
    const buildings = this.options.buildingManager.getSnapshots();
    const buildingIdMatch = meshName.match(/^(building-\d+)/);
    if (!buildingIdMatch) {
      this.options.onBuildingUnavailable('not_found');
      return;
    }

    const buildingId = buildingIdMatch[1];
    const building = buildings.find((b) => b.id === buildingId);
    if (!building) {
      this.options.onBuildingUnavailable('not_found');
      return;
    }

    if (building.status === 'complete') {
      this.options.onBuildingPicked({ type: 'building', building });
      return;
    }

    this.options.onBuildingUnavailable('under_construction');
  }

  private handlePick(clientX: number, clientY: number): void {
    const canvas = this.options.scene.getEngine().getRenderingCanvas();
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX < 0 || localX > rect.width || localY < 0 || localY > rect.height) {
      return;
    }

    const engine = this.options.scene.getEngine();
    const pickResults = this.options.scene.multiPick(
      localX,
      localY,
      (mesh) => mesh.isPickable && mesh.isEnabled(),
    );
    if (!pickResults || pickResults.length === 0) {
      return;
    }

    const hitCandidates = pickResults
      .filter((hit) => hit.hit && hit.pickedMesh)
      .map((hit): InteractiveHitCandidate => {
        const pickedMesh = hit.pickedMesh as AbstractMesh;
        return {
          distance: hit.distance,
          meshName: pickedMesh.name,
          agentMeshName: this.findNamedMeshInHierarchy(pickedMesh, 'builder-agent-'),
          buildingMeshName: this.findNamedMeshInHierarchy(pickedMesh, 'building-'),
        };
      })
      .sort((left, right) => left.distance - right.distance);

    if (hitCandidates.length === 0) {
      return;
    }

    if (this.isPickDebugEnabled()) {
      console.info('[WorldPicker] pick', {
        clientX,
        clientY,
        localX,
        localY,
        hardwareScalingLevel: engine.getHardwareScalingLevel(),
        renderWidth: engine.getRenderWidth(),
        renderHeight: engine.getRenderHeight(),
        hits: hitCandidates.slice(0, 3).map((hit) => ({
          meshName: hit.meshName,
          distance: Number(hit.distance.toFixed(3)),
          agentMeshName: hit.agentMeshName,
          buildingMeshName: hit.buildingMeshName,
        })),
      });
    }

    const nearestAgentHit = hitCandidates.find((hit) => hit.agentMeshName);
    const nearestBuildingHit = hitCandidates.find(
      (hit) => hit.buildingMeshName || hit.meshName.startsWith('building-')
    );

    this.lastPickHandledAtMs = Date.now();

    // Bot-first priority when hits overlap.
    if (nearestAgentHit?.agentMeshName) {
      const agent = this.options.agentManager.findAgentByMeshName(nearestAgentHit.agentMeshName);
      if (agent) {
        this.handleAgentPick(agent);
        return;
      }
    }

    if (nearestBuildingHit) {
      this.handleBuildingPick(nearestBuildingHit.buildingMeshName ?? nearestBuildingHit.meshName);
    }
  }

  private findNamedMeshInHierarchy(mesh: AbstractMesh, prefix: string): string | null {
    let current: AbstractMesh | null = mesh;
    while (current) {
      if (current.name.startsWith(prefix)) {
        return current.name;
      }
      current = current.parent instanceof AbstractMesh ? current.parent : null;
    }
    return null;
  }

  private isPickDebugEnabled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return window.localStorage.getItem(PICK_DEBUG_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
