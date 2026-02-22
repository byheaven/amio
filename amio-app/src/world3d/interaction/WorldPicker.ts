import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { AgentManager } from '../agents/AgentManager';
import { BuilderAgent } from '../agents/BuilderAgent';
import { BuildingManager } from '../buildings/BuildingManager';
import { BuildingSnapshot } from '../buildings/types';

export const CHAT_INTERACTION_DISTANCE = 8;
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

export interface WorldPickerOptions {
  scene: Scene;
  agentManager: AgentManager;
  buildingManager: BuildingManager;
  getPlayerPosition: () => Vector3 | null;
  onAgentPicked: (result: AgentPickResult) => void;
  onBuildingPicked: (result: BuildingPickResult) => void;
  onTooFar: (agentName: string) => void;
  onAgentBusy: (agentName: string) => void;
}

export class WorldPicker {
  private readonly options: WorldPickerOptions;
  private pointerDownTime = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
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
    }
  }

  private registerEvents(): void {
    const canvas = this.options.scene.getEngine().getRenderingCanvas();
    if (!canvas) {
      return;
    }
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
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

    const pickResult = this.options.scene.pick(
      evt.clientX,
      evt.clientY,
      (mesh) => mesh.isPickable && mesh.isEnabled(),
    );

    if (!pickResult?.hit || !pickResult.pickedMesh) {
      return;
    }

    const meshName = pickResult.pickedMesh.name;

    // Check agent pick
    if (meshName.startsWith('builder-agent-')) {
      const agent = this.options.agentManager.findAgentByMeshName(meshName);
      if (agent) {
        this.handleAgentPick(agent);
        return;
      }
    }

    // Check building pick (buildings use mesh names like "building-X-mesh-*" or "building-*")
    if (meshName.startsWith('building-')) {
      this.handleBuildingPick(meshName);
    }
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
      if (currentUser !== 'player') {
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
      return;
    }
    const buildingId = buildingIdMatch[1];
    const building = buildings.find((b) => b.id === buildingId);

    if (building && building.status === 'complete') {
      this.options.onBuildingPicked({ type: 'building', building });
    }
  }
}
