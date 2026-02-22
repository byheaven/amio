import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PLAYER_GROUND_HEIGHT } from '../constants';
import { BehaviorTree } from '../behaviorTree/BehaviorTree';
import { ActionNode } from '../behaviorTree/nodes/ActionNode';
import { ConditionNode } from '../behaviorTree/nodes/ConditionNode';
import { SelectorNode } from '../behaviorTree/nodes/SelectorNode';
import { SequenceNode } from '../behaviorTree/nodes/SequenceNode';
import { NodeStatus } from '../behaviorTree/types';
import { BuildingManager } from '../buildings/BuildingManager';
import { BuildTask, BuilderAgentMode, BuilderAgentSnapshot, BuilderAgentTickContext } from './types';

const AGENT_MOVE_SPEED = 2.8;
const AGENT_STOP_DISTANCE = 1.2;
const BUILD_PROGRESS_PER_SECOND = 0.22;
const FACE_PLAYER_SPEED = 4;

interface BuilderAgentOptions {
  id: string;
  name: string;
  mesh: Mesh;
  buildingManager: BuildingManager;
  patrolRoute: Vector3[];
}

export class BuilderAgent {
  private readonly id: string;
  private readonly name: string;
  private readonly mesh: Mesh;
  private readonly buildingManager: BuildingManager;
  private readonly patrolRoute: Vector3[];
  private readonly behaviorTree: BehaviorTree<BuilderAgentTickContext>;

  private movementTarget: Vector3 | null = null;
  private mode: BuilderAgentMode = 'idle';
  private statusText = '待命中';
  private patrolIndex = 0;

  private currentTask: BuildTask | null = null;
  private currentBuildingId: string | null = null;
  private buildProgress = 0;

  private conversationWith: string | null = null;
  private conversationPlayerPosition: Vector3 | null = null;

  public constructor(options: BuilderAgentOptions) {
    this.id = options.id;
    this.name = options.name;
    this.mesh = options.mesh;
    this.buildingManager = options.buildingManager;
    this.patrolRoute = options.patrolRoute.map((point) => point.clone());

    this.behaviorTree = this.createBehaviorTree();
  }

  public fixedTick(context: BuilderAgentTickContext): void {
    this.behaviorTree.tick(context);
  }

  public frameUpdate(deltaSeconds: number): void {
    if (this.conversationWith && this.conversationPlayerPosition) {
      this.facePosition(this.conversationPlayerPosition, deltaSeconds);
      return;
    }

    if (!this.movementTarget) {
      return;
    }

    const toTarget = this.movementTarget.subtract(this.mesh.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    if (distance <= 0.0001) {
      return;
    }

    const direction = toTarget.scale(1 / distance);
    const step = Math.min(AGENT_MOVE_SPEED * deltaSeconds, distance);
    const displacement = new Vector3(direction.x * step, 0, direction.z * step);

    this.mesh.moveWithCollisions(displacement);
    if (this.mesh.position.y < PLAYER_GROUND_HEIGHT) {
      this.mesh.position.y = PLAYER_GROUND_HEIGHT;
    }

    if (Math.abs(direction.x) > 0.001 || Math.abs(direction.z) > 0.001) {
      this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }

  public assignBuildTask(task: BuildTask): void {
    this.currentTask = {
      ...task,
      position: task.position.clone(),
    };
    this.currentBuildingId = null;
    this.buildProgress = 0;
  }

  public hasBuildTask(): boolean {
    return this.currentTask !== null;
  }

  public isReadyForTask(): boolean {
    return this.currentTask === null;
  }

  public isInConversation(): boolean {
    return this.conversationWith !== null;
  }

  public startConversation(userId: string, playerPosition: Vector3): void {
    this.conversationWith = userId;
    this.conversationPlayerPosition = playerPosition.clone();
    this.movementTarget = null;
    this.statusText = '对话中...';
    this.mode = 'idle';
  }

  public updateConversationPlayerPosition(playerPosition: Vector3): void {
    if (this.conversationWith) {
      this.conversationPlayerPosition = playerPosition.clone();
    }
  }

  public endConversation(): void {
    this.conversationWith = null;
    this.conversationPlayerPosition = null;
  }

  public getConversationUserId(): string | null {
    return this.conversationWith;
  }

  public getPosition(): Vector3 {
    return this.mesh.position.clone();
  }

  public getMeshName(): string {
    return this.mesh.name;
  }

  public getStatusText(): string {
    return this.statusText;
  }

  public getMode(): BuilderAgentMode {
    return this.mode;
  }

  public getDisplayName(): string {
    return this.name;
  }

  public getSnapshot(): BuilderAgentSnapshot {
    const snapshot: BuilderAgentSnapshot = {
      id: this.id,
      name: this.name,
      position: this.mesh.position.clone(),
      rotationY: this.mesh.rotation.y,
      mode: this.mode,
      statusText: this.statusText,
    };

    if (this.currentTask) {
      snapshot.taskId = this.currentTask.id;
      snapshot.buildProgress = this.buildProgress;
    }

    return snapshot;
  }

  public dispose(): void {
    this.mesh.dispose();
  }

  private facePosition(target: Vector3, deltaSeconds: number): void {
    const dx = target.x - this.mesh.position.x;
    const dz = target.z - this.mesh.position.z;
    if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) {
      return;
    }
    const targetAngle = Math.atan2(dx, dz);
    const currentAngle = this.mesh.rotation.y;
    let diff = targetAngle - currentAngle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const maxStep = FACE_PLAYER_SPEED * deltaSeconds;
    this.mesh.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
  }

  private createBehaviorTree(): BehaviorTree<BuilderAgentTickContext> {
    const root = new SelectorNode<BuilderAgentTickContext>([
      // Priority 1: In conversation — stop and face player
      new SequenceNode<BuilderAgentTickContext>([
        new ConditionNode<BuilderAgentTickContext>(() => this.conversationWith !== null),
        new ActionNode<BuilderAgentTickContext>(() => this.tickConversation()),
      ]),
      // Priority 2: Has a build task (from user dialog or system)
      new SequenceNode<BuilderAgentTickContext>([
        new ConditionNode<BuilderAgentTickContext>(() => this.currentTask !== null),
        new ActionNode<BuilderAgentTickContext>(() => this.moveToBuildTarget()),
        new ActionNode<BuilderAgentTickContext>((context) => this.progressBuild(context.deltaSeconds)),
      ]),
      // Priority 3: Patrol
      new SequenceNode<BuilderAgentTickContext>([
        new ConditionNode<BuilderAgentTickContext>(() => this.patrolRoute.length > 0),
        new ActionNode<BuilderAgentTickContext>(() => this.moveToPatrolTarget()),
        new ActionNode<BuilderAgentTickContext>(() => this.advancePatrolIndex()),
      ]),
      // Default: Idle
      new ActionNode<BuilderAgentTickContext>(() => this.tickIdle()),
    ]);

    return new BehaviorTree(root);
  }

  private tickConversation(): NodeStatus {
    this.mode = 'idle';
    this.movementTarget = null;
    return NodeStatus.Running;
  }

  private moveToBuildTarget(): NodeStatus {
    if (!this.currentTask) {
      return NodeStatus.Failure;
    }

    this.mode = 'building';
    this.statusText = `前往建造点：${this.currentTask.name}`;
    this.movementTarget = this.currentTask.position;

    if (this.distanceTo(this.currentTask.position) <= AGENT_STOP_DISTANCE) {
      this.movementTarget = null;
      return NodeStatus.Success;
    }

    return NodeStatus.Running;
  }

  private progressBuild(deltaSeconds: number): NodeStatus {
    if (!this.currentTask) {
      return NodeStatus.Failure;
    }

    if (!this.currentBuildingId) {
      this.currentBuildingId = this.buildingManager.createBuildingSite({
        type: this.currentTask.type,
        name: this.currentTask.name,
        position: this.currentTask.position,
        rotationY: this.currentTask.rotationY,
        requestedBy: this.currentTask.requestedBy,
      });
    }

    this.buildProgress = Math.min(1, this.buildProgress + BUILD_PROGRESS_PER_SECOND * deltaSeconds);
    this.buildingManager.setProgress(this.currentBuildingId, this.buildProgress);

    const percent = Math.round(this.buildProgress * 100);
    this.statusText = `正在建造：${this.currentTask.name} ${percent}%`;

    if (this.buildProgress >= 1) {
      this.buildingManager.complete(this.currentBuildingId);
      this.statusText = `建造完成：${this.currentTask.name}`;
      this.currentTask = null;
      this.currentBuildingId = null;
      this.buildProgress = 0;
      return NodeStatus.Success;
    }

    return NodeStatus.Running;
  }

  private moveToPatrolTarget(): NodeStatus {
    if (this.patrolRoute.length === 0) {
      return NodeStatus.Failure;
    }

    const routeIndex = this.patrolIndex % this.patrolRoute.length;
    const patrolTarget = this.patrolRoute[routeIndex];
    this.mode = 'patrol';
    this.statusText = `巡逻中 (${routeIndex + 1}/${this.patrolRoute.length})`;
    this.movementTarget = patrolTarget;

    if (this.distanceTo(patrolTarget) <= AGENT_STOP_DISTANCE) {
      this.movementTarget = null;
      return NodeStatus.Success;
    }

    return NodeStatus.Running;
  }

  private advancePatrolIndex(): NodeStatus {
    if (this.patrolRoute.length === 0) {
      return NodeStatus.Failure;
    }

    this.patrolIndex = (this.patrolIndex + 1) % this.patrolRoute.length;
    return NodeStatus.Success;
  }

  private tickIdle(): NodeStatus {
    this.mode = 'idle';
    this.statusText = '待命中';
    this.movementTarget = null;
    return NodeStatus.Running;
  }

  private distanceTo(target: Vector3): number {
    const dx = target.x - this.mesh.position.x;
    const dz = target.z - this.mesh.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
