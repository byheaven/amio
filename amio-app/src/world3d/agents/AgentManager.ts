import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { Scene } from '@babylonjs/core/scene';
import { BuildingManager } from '../buildings/BuildingManager';
import { BuildingType } from '../buildings/types';
import { createBillboardText, BillboardText } from '../scene/createBillboardText';
import { BuilderAgent } from './BuilderAgent';
import { AssignBuildTaskResult, BuildTask, BuilderAgentSnapshot } from './types';

interface AgentEntry {
  agent: BuilderAgent;
  label: BillboardText;
  nextTaskAtMs: number;
  wasBusy: boolean;
}

const AGENT_NAMES = [
  'Builder-01',
  'Builder-02',
  'Builder-03',
  'Builder-04',
  'Builder-05',
  'Builder-06',
  'Builder-07',
];

const BUILD_TASK_POSITIONS = [
  new Vector3(24, 0, -8),
  new Vector3(18, 0, 20),
  new Vector3(32, 0, 14),
  new Vector3(-20, 0, 24),
  new Vector3(-30, 0, 8),
  new Vector3(-22, 0, -18),
  new Vector3(8, 0, -28),
  new Vector3(-2, 0, 30),
  new Vector3(34, 0, -24),
  new Vector3(-34, 0, -6),
  new Vector3(10, 0, 34),
  new Vector3(-12, 0, -32),
];

const TASK_TYPE_ROTATION: BuildingType[] = ['monument', 'house', 'garden'];

const AGENT_SPAWNS = [
  new Vector3(14, 1, -4),
  new Vector3(-14, 1, 2),
  new Vector3(3, 1, 14),
  new Vector3(-3, 1, -14),
  new Vector3(20, 1, 16),
  new Vector3(-22, 1, -12),
  new Vector3(0, 1, 24),
];

const randomBetween = (min: number, max: number): number => (
  min + Math.random() * (max - min)
);

export class AgentManager {
  private readonly scene: Scene;
  private readonly buildingManager: BuildingManager;
  private readonly agents: AgentEntry[] = [];

  private readonly taskQueue: BuildTask[] = [];
  private taskCounter = 0;

  public constructor(scene: Scene, buildingManager: BuildingManager) {
    this.scene = scene;
    this.buildingManager = buildingManager;

    this.spawnAgents();
    this.refillTaskQueue(16);
  }

  public fixedTick(deltaSeconds: number, nowMs: number): void {
    this.refillTaskQueue(8);

    this.agents.forEach((entry) => {
      entry.agent.fixedTick({ deltaSeconds, nowMs });
      this.updateAgentLabel(entry);

      const busyNow = entry.agent.hasBuildTask();
      if (entry.wasBusy && !busyNow) {
        entry.nextTaskAtMs = nowMs + randomBetween(1500, 4500);
      }
      entry.wasBusy = busyNow;

      if (!busyNow && !entry.agent.isInConversation() && nowMs >= entry.nextTaskAtMs) {
        this.assignNextAvailableTask(entry, nowMs);
      }
    });
  }

  public frameUpdate(deltaSeconds: number): void {
    this.agents.forEach((entry) => {
      entry.agent.frameUpdate(deltaSeconds);
    });
  }

  public getSnapshots(): BuilderAgentSnapshot[] {
    return this.agents.map((entry) => entry.agent.getSnapshot());
  }

  public getAgentById(agentId: string): BuilderAgent | null {
    const entry = this.agents.find((e) => e.agent.getSnapshot().id === agentId);
    return entry?.agent ?? null;
  }

  public findAgentByMeshName(meshName: string): BuilderAgent | null {
    const entry = this.agents.find((e) => e.agent.getMeshName() === meshName);
    return entry?.agent ?? null;
  }

  public isAgentInConversation(agentId: string): boolean {
    const agent = this.getAgentById(agentId);
    return agent?.isInConversation() ?? false;
  }

  public assignUserBuildTask(agentId: string, task: BuildTask): AssignBuildTaskResult {
    const agent = this.getAgentById(agentId);
    if (!agent) {
      return 'agent_not_found';
    }

    if (agent.hasBuildTask()) {
      return 'agent_busy';
    }

    agent.endConversation();
    agent.assignBuildTask(task);
    const entry = this.agents.find((e) => e.agent === agent);
    if (entry) {
      entry.wasBusy = true;
      entry.nextTaskAtMs = Number.POSITIVE_INFINITY;
      this.updateAgentLabel(entry);
    }
    return 'assigned';
  }

  public dispose(): void {
    this.agents.forEach((entry) => {
      entry.label.dispose();
      entry.agent.dispose();
    });
    this.agents.length = 0;
    this.taskQueue.length = 0;
  }

  private spawnAgents(): void {
    AGENT_NAMES.forEach((name, index) => {
      const mesh = CreateCapsule(
        `builder-agent-${index}`,
        {
          height: 1.9,
          radius: 0.45,
          tessellation: 8,
        },
        this.scene
      );

      mesh.position.copyFrom(AGENT_SPAWNS[index]);
      mesh.checkCollisions = true;
      mesh.isPickable = true;
      mesh.ellipsoid = new Vector3(0.45, 0.95, 0.45);
      mesh.ellipsoidOffset = new Vector3(0, 0.95, 0);

      const material = new StandardMaterial(`builder-agent-material-${index}`, this.scene);
      material.diffuseColor = new Color3(0.42, 0.76, 0.97);
      material.emissiveColor = new Color3(0.03, 0.07, 0.11);
      material.specularColor = new Color3(0.1, 0.2, 0.3);
      mesh.material = material;

      const patrolRoute = this.createPatrolRoute(mesh.position);
      const agent = new BuilderAgent({
        id: `agent-${index + 1}`,
        name,
        mesh,
        buildingManager: this.buildingManager,
        patrolRoute,
      });

      const label = createBillboardText(this.scene, `agent-${index + 1}-label`, {
        width: 7,
        height: 3,
        font: 'bold 34px "Noto Sans SC", sans-serif',
        textColor: '#EAF5FF',
        backgroundColor: 'rgba(10, 20, 35, 0.62)',
        emissiveColor: new Color3(0.82, 0.9, 1),
        offset: new Vector3(0, 3.3, 0),
        parent: mesh,
      });

      const nextTaskAtMs = Date.now() + randomBetween(300, 2600);
      const entry: AgentEntry = {
        agent,
        label,
        nextTaskAtMs,
        wasBusy: false,
      };

      this.updateAgentLabel(entry);
      this.agents.push(entry);
    });
  }

  private createPatrolRoute(center: Vector3): Vector3[] {
    const radius = randomBetween(4, 8);
    return [
      new Vector3(center.x + radius, 1, center.z + radius),
      new Vector3(center.x - radius, 1, center.z + radius),
      new Vector3(center.x - radius, 1, center.z - radius),
      new Vector3(center.x + radius, 1, center.z - radius),
    ];
  }

  private refillTaskQueue(minSize: number): void {
    while (this.taskQueue.length < minSize) {
      const position = BUILD_TASK_POSITIONS[this.taskCounter % BUILD_TASK_POSITIONS.length];
      const type = TASK_TYPE_ROTATION[this.taskCounter % TASK_TYPE_ROTATION.length];
      this.taskCounter += 1;

      this.taskQueue.push({
        id: `build-task-${this.taskCounter}`,
        type,
        name: `${type}-${this.taskCounter}`,
        position: position.clone(),
        requestedBy: 'system',
      });
    }
  }

  private assignNextAvailableTask(entry: AgentEntry, nowMs: number): void {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) {
        break;
      }

      if (this.buildingManager.isPositionOccupied(task.position, 4)) {
        continue;
      }

      entry.agent.assignBuildTask(task);
      entry.wasBusy = true;
      entry.nextTaskAtMs = Number.POSITIVE_INFINITY;
      this.updateAgentLabel(entry);
      return;
    }

    entry.nextTaskAtMs = nowMs + randomBetween(2000, 3600);
  }

  private updateAgentLabel(entry: AgentEntry): void {
    const labelText = `${entry.agent.getDisplayName()}\n${entry.agent.getStatusText()}`;
    entry.label.setText(labelText);
  }
}
