# SharkStar 3D World Sprint 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有 Sprint 1（可进入 3D 世界 + 玩家移动）基础上，实现本地单用户的 AI Builder 机器人自主巡逻与建造建筑，支持建造进度展示，并为后续持久化预留 `WorldState` 序列化结构。

**Architecture:** 在 `WorldRuntime` 的 renderLoop 中增加 5Hz 固定步长 tick（accumulator 驱动），将 AI/建造等“世界逻辑”放入固定 tick；将 Agent 移动插值与渲染放入每帧 frameUpdate。行为树与世界状态为纯 TS 逻辑，Babylon 仅作为渲染与碰撞移动实现。

**Tech Stack:** Taro (React) + TypeScript + Babylon.js (`@babylonjs/core`) + Jest（单测）

---

## Pre-flight

所有命令在 `amio-app/` 下执行：

```bash
cd amio-app
```

建议使用 git worktree 隔离开发（可选，但推荐）：

```bash
ls -d .worktrees 2>/dev/null || true
ls -d worktrees 2>/dev/null || true
git check-ignore -q .worktrees 2>/dev/null && echo ".worktrees ignored"
git worktree add .worktrees/world3d-sprint2 -b feat/world3d-sprint2
```

验证当前基线：

```bash
npm test
```

Expected: PASS

---

### Task 1: Add Behavior Tree core types

**Files:**
- Create: `amio-app/src/world3d/behaviorTree/types.ts`

**Step 1: Add minimal types**

```ts
// amio-app/src/world3d/behaviorTree/types.ts
export enum NodeStatus {
  Running = 'Running',
  Success = 'Success',
  Failure = 'Failure',
}

export interface BehaviorNode<TContext> {
  tick: (context: TContext) => NodeStatus;
  reset?: () => void;
}
```

**Step 2: Type-check build**

Run: `npm run build:h5 -- --no-minify`

Expected: build succeeds

**Step 3: Commit**

```bash
git add amio-app/src/world3d/behaviorTree/types.ts
git commit -m "feat(world3d): add behavior tree core types"
```

---

### Task 2: Add ConditionNode (TDD)

**Files:**
- Create: `amio-app/src/world3d/behaviorTree/nodes/ConditionNode.ts`
- Test: `amio-app/__tests__/unit/world3d/behaviorTree/ConditionNode.test.ts`

**Step 1: Write failing test**

```ts
// amio-app/__tests__/unit/world3d/behaviorTree/ConditionNode.test.ts
import { NodeStatus } from '@/world3d/behaviorTree/types';
import { ConditionNode } from '@/world3d/behaviorTree/nodes/ConditionNode';

describe('ConditionNode', () => {
  it('returns Success when predicate is true', () => {
    const node = new ConditionNode(() => true);
    expect(node.tick({})).toBe(NodeStatus.Success);
  });

  it('returns Failure when predicate is false', () => {
    const node = new ConditionNode(() => false);
    expect(node.tick({})).toBe(NodeStatus.Failure);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --testPathPattern=ConditionNode`

Expected: FAIL (module not found)

**Step 3: Implement minimal node**

```ts
// amio-app/src/world3d/behaviorTree/nodes/ConditionNode.ts
import { BehaviorNode, NodeStatus } from '../types';

export class ConditionNode<TContext> implements BehaviorNode<TContext> {
  private readonly predicate: (context: TContext) => boolean;

  public constructor(predicate: (context: TContext) => boolean) {
    this.predicate = predicate;
  }

  public tick(context: TContext): NodeStatus {
    return this.predicate(context) ? NodeStatus.Success : NodeStatus.Failure;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --testPathPattern=ConditionNode`

Expected: PASS

**Step 5: Commit**

```bash
git add amio-app/src/world3d/behaviorTree/nodes/ConditionNode.ts amio-app/__tests__/unit/world3d/behaviorTree/ConditionNode.test.ts
git commit -m "test(world3d): add ConditionNode"
```

---

### Task 3: Add ActionNode (TDD)

**Files:**
- Create: `amio-app/src/world3d/behaviorTree/nodes/ActionNode.ts`
- Test: `amio-app/__tests__/unit/world3d/behaviorTree/ActionNode.test.ts`

**Step 1: Write failing test**

```ts
// amio-app/__tests__/unit/world3d/behaviorTree/ActionNode.test.ts
import { NodeStatus } from '@/world3d/behaviorTree/types';
import { ActionNode } from '@/world3d/behaviorTree/nodes/ActionNode';

describe('ActionNode', () => {
  it('returns the action result', () => {
    const node = new ActionNode(() => NodeStatus.Running);
    expect(node.tick({})).toBe(NodeStatus.Running);
  });
});
```

**Step 2: Run test (should fail)**

Run: `npm run test:unit -- --testPathPattern=ActionNode`

Expected: FAIL (module not found)

**Step 3: Implement minimal node**

```ts
// amio-app/src/world3d/behaviorTree/nodes/ActionNode.ts
import { BehaviorNode, NodeStatus } from '../types';

export class ActionNode<TContext> implements BehaviorNode<TContext> {
  private readonly action: (context: TContext) => NodeStatus;

  public constructor(action: (context: TContext) => NodeStatus) {
    this.action = action;
  }

  public tick(context: TContext): NodeStatus {
    return this.action(context);
  }
}
```

**Step 4: Run test (should pass)**

Run: `npm run test:unit -- --testPathPattern=ActionNode`

Expected: PASS

**Step 5: Commit**

```bash
git add amio-app/src/world3d/behaviorTree/nodes/ActionNode.ts amio-app/__tests__/unit/world3d/behaviorTree/ActionNode.test.ts
git commit -m "test(world3d): add ActionNode"
```

---

### Task 4: Add SequenceNode with Running resume (TDD)

**Files:**
- Create: `amio-app/src/world3d/behaviorTree/nodes/SequenceNode.ts`
- Test: `amio-app/__tests__/unit/world3d/behaviorTree/SequenceNode.test.ts`

**Step 1: Write failing test**

```ts
// amio-app/__tests__/unit/world3d/behaviorTree/SequenceNode.test.ts
import { NodeStatus } from '@/world3d/behaviorTree/types';
import { ActionNode } from '@/world3d/behaviorTree/nodes/ActionNode';
import { SequenceNode } from '@/world3d/behaviorTree/nodes/SequenceNode';

describe('SequenceNode', () => {
  it('returns Failure when any child fails', () => {
    const seq = new SequenceNode([
      new ActionNode(() => NodeStatus.Success),
      new ActionNode(() => NodeStatus.Failure),
    ]);

    expect(seq.tick({})).toBe(NodeStatus.Failure);
  });

  it('returns Success when all children succeed', () => {
    const seq = new SequenceNode([
      new ActionNode(() => NodeStatus.Success),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(seq.tick({})).toBe(NodeStatus.Success);
  });

  it('resumes from the running child on next tick', () => {
    let secondCalls = 0;
    const seq = new SequenceNode([
      new ActionNode(() => NodeStatus.Success),
      new ActionNode(() => {
        secondCalls += 1;
        return secondCalls === 1 ? NodeStatus.Running : NodeStatus.Success;
      }),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(seq.tick({})).toBe(NodeStatus.Running);
    expect(seq.tick({})).toBe(NodeStatus.Success);
  });
});
```

**Step 2: Run test (should fail)**

Run: `npm run test:unit -- --testPathPattern=SequenceNode`

Expected: FAIL (module not found)

**Step 3: Implement minimal SequenceNode**

```ts
// amio-app/src/world3d/behaviorTree/nodes/SequenceNode.ts
import { BehaviorNode, NodeStatus } from '../types';

export class SequenceNode<TContext> implements BehaviorNode<TContext> {
  private readonly children: Array<BehaviorNode<TContext>>;
  private runningIndex = 0;

  public constructor(children: Array<BehaviorNode<TContext>>) {
    this.children = children;
  }

  public reset(): void {
    this.runningIndex = 0;
    this.children.forEach((child) => child.reset?.());
  }

  public tick(context: TContext): NodeStatus {
    for (let index = this.runningIndex; index < this.children.length; index += 1) {
      const status = this.children[index].tick(context);
      if (status === NodeStatus.Running) {
        this.runningIndex = index;
        return NodeStatus.Running;
      }
      if (status === NodeStatus.Failure) {
        this.reset();
        return NodeStatus.Failure;
      }
    }

    this.reset();
    return NodeStatus.Success;
  }
}
```

**Step 4: Run test (should pass)**

Run: `npm run test:unit -- --testPathPattern=SequenceNode`

Expected: PASS

**Step 5: Commit**

```bash
git add amio-app/src/world3d/behaviorTree/nodes/SequenceNode.ts amio-app/__tests__/unit/world3d/behaviorTree/SequenceNode.test.ts
git commit -m "test(world3d): add SequenceNode with running resume"
```

---

### Task 5: Add SelectorNode with Running resume (TDD)

**Files:**
- Create: `amio-app/src/world3d/behaviorTree/nodes/SelectorNode.ts`
- Test: `amio-app/__tests__/unit/world3d/behaviorTree/SelectorNode.test.ts`

**Step 1: Write failing test**

```ts
// amio-app/__tests__/unit/world3d/behaviorTree/SelectorNode.test.ts
import { NodeStatus } from '@/world3d/behaviorTree/types';
import { ActionNode } from '@/world3d/behaviorTree/nodes/ActionNode';
import { SelectorNode } from '@/world3d/behaviorTree/nodes/SelectorNode';

describe('SelectorNode', () => {
  it('returns Success when any child succeeds', () => {
    const sel = new SelectorNode([
      new ActionNode(() => NodeStatus.Failure),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(sel.tick({})).toBe(NodeStatus.Success);
  });

  it('returns Failure when all children fail', () => {
    const sel = new SelectorNode([
      new ActionNode(() => NodeStatus.Failure),
      new ActionNode(() => NodeStatus.Failure),
    ]);

    expect(sel.tick({})).toBe(NodeStatus.Failure);
  });

  it('resumes from the running child on next tick', () => {
    let firstCalls = 0;
    const sel = new SelectorNode([
      new ActionNode(() => {
        firstCalls += 1;
        return firstCalls === 1 ? NodeStatus.Running : NodeStatus.Success;
      }),
      new ActionNode(() => NodeStatus.Success),
    ]);

    expect(sel.tick({})).toBe(NodeStatus.Running);
    expect(sel.tick({})).toBe(NodeStatus.Success);
  });
});
```

**Step 2: Run test (should fail)**

Run: `npm run test:unit -- --testPathPattern=SelectorNode`

Expected: FAIL

**Step 3: Implement minimal SelectorNode**

```ts
// amio-app/src/world3d/behaviorTree/nodes/SelectorNode.ts
import { BehaviorNode, NodeStatus } from '../types';

export class SelectorNode<TContext> implements BehaviorNode<TContext> {
  private readonly children: Array<BehaviorNode<TContext>>;
  private runningIndex = 0;

  public constructor(children: Array<BehaviorNode<TContext>>) {
    this.children = children;
  }

  public reset(): void {
    this.runningIndex = 0;
    this.children.forEach((child) => child.reset?.());
  }

  public tick(context: TContext): NodeStatus {
    for (let index = this.runningIndex; index < this.children.length; index += 1) {
      const status = this.children[index].tick(context);
      if (status === NodeStatus.Running) {
        this.runningIndex = index;
        return NodeStatus.Running;
      }
      if (status === NodeStatus.Success) {
        this.reset();
        return NodeStatus.Success;
      }
    }

    this.reset();
    return NodeStatus.Failure;
  }
}
```

**Step 4: Run test (should pass)**

Run: `npm run test:unit -- --testPathPattern=SelectorNode`

Expected: PASS

**Step 5: Commit**

```bash
git add amio-app/src/world3d/behaviorTree/nodes/SelectorNode.ts amio-app/__tests__/unit/world3d/behaviorTree/SelectorNode.test.ts
git commit -m "test(world3d): add SelectorNode with running resume"
```

---

### Task 6: Add BehaviorTree wrapper

**Files:**
- Create: `amio-app/src/world3d/behaviorTree/BehaviorTree.ts`

**Step 1: Write minimal wrapper**

```ts
// amio-app/src/world3d/behaviorTree/BehaviorTree.ts
import { BehaviorNode, NodeStatus } from './types';

export class BehaviorTree<TContext> {
  private readonly root: BehaviorNode<TContext>;

  public constructor(root: BehaviorNode<TContext>) {
    this.root = root;
  }

  public tick(context: TContext): NodeStatus {
    return this.root.tick(context);
  }

  public reset(): void {
    this.root.reset?.();
  }
}
```

**Step 2: Run unit tests**

Run: `npm run test:unit -- --testPathPattern=behaviorTree`

Expected: PASS

**Step 3: Commit**

```bash
git add amio-app/src/world3d/behaviorTree/BehaviorTree.ts
git commit -m "feat(world3d): add BehaviorTree wrapper"
```

---

### Task 7: Add 3D billboard text helper (DynamicTexture)

**Files:**
- Create: `amio-app/src/world3d/scene/createBillboardText.ts`

**Step 1: Implement helper**

Implementation target (skeleton):

```ts
// amio-app/src/world3d/scene/createBillboardText.ts
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';

export interface BillboardText {
  mesh: Mesh;
  setText: (text: string) => void;
  dispose: () => void;
}

export interface CreateBillboardTextOptions {
  width: number;
  height: number;
  font: string;
  textColor: string;
  backgroundColor: string;
  emissiveColor?: Color3;
  offset?: Vector3;
}

export const createBillboardText = (
  scene: Scene,
  name: string,
  options: CreateBillboardTextOptions
): BillboardText => {
  const plane = CreatePlane(name, { width: options.width, height: options.height }, scene);
  plane.isPickable = false;
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

  const texture = new DynamicTexture(`${name}-texture`, { width: 512, height: 256 }, scene, true);
  texture.hasAlpha = true;

  const material = new StandardMaterial(`${name}-material`, scene);
  material.diffuseTexture = texture;
  material.opacityTexture = texture;
  material.emissiveColor = options.emissiveColor ?? new Color3(1, 1, 1);
  material.specularColor = Color3.Black();
  plane.material = material;

  let lastText = '';
  const setText = (text: string) => {
    if (text === lastText) return;
    lastText = text;
    texture.drawText(text, null, null, options.font, options.textColor, options.backgroundColor, true, true);
  };

  if (options.offset) {
    plane.position = options.offset.clone();
  }

  return {
    mesh: plane,
    setText,
    dispose: () => {
      plane.dispose();
      texture.dispose();
      material.dispose();
    },
  };
};
```

**Step 2: Manual smoke test**

Run: `npm run dev:h5`

Expected: world 页面仍能正常加载（此任务不接入 runtime，只确保无构建/运行错误）

**Step 3: Commit**

```bash
git add amio-app/src/world3d/scene/createBillboardText.ts
git commit -m "feat(world3d): add billboard text helper"
```

---

### Task 8: Add Building types + prefabs

**Files:**
- Create: `amio-app/src/world3d/buildings/types.ts`
- Create: `amio-app/src/world3d/buildings/prefabs.ts`

**Step 1: Add types**

```ts
// amio-app/src/world3d/buildings/types.ts
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
  requestedBy: 'system';
}
```

**Step 2: Add prefab factory (geometry only)**

Define `createBuildingPrefab(scene, type)` returning a root `Mesh` (or `TransformNode`) with child meshes.

**Step 3: Commit**

```bash
git add amio-app/src/world3d/buildings/types.ts amio-app/src/world3d/buildings/prefabs.ts
git commit -m "feat(world3d): add building types and prefab factory"
```

---

### Task 9: Implement BuildingManager (visual + progress)

**Files:**
- Create: `amio-app/src/world3d/buildings/BuildingManager.ts`

**Step 1: Implement manager API**

Target API:

```ts
export interface CreateBuildingRequest {
  type: BuildingType;
  name: string;
  position: Vector3;
  rotationY?: number;
  requestedBy?: 'system';
}

export class BuildingManager {
  public constructor(scene: Scene);
  public createBuildingSite(req: CreateBuildingRequest): string; // returns buildingId
  public setProgress(buildingId: string, progress: number): void;
  public complete(buildingId: string): void;
  public fixedTick(deltaSeconds: number, nowMs: number): void; // optional hooks
  public dispose(): void;
}
```

- 建造中：prefab 半透明 + label（`createBillboardText`）显示 `name` + `XX%`
- 完成：alpha=1 + label 改为 `name`（或隐藏 progress 行）

**Step 2: Manual verify**

在 `WorldRuntime` 未接入前，可在 `createBaseScene.ts` 里临时创建 1 个 building site 做视觉验收（验收后删除临时代码）。

Run: `npm run dev:h5`

Expected: 看到 1 个建造中建筑（半透明 + 名称/百分比）

**Step 3: Commit**

```bash
git add amio-app/src/world3d/buildings/BuildingManager.ts
git commit -m "feat(world3d): add BuildingManager with progress visuals"
```

---

### Task 10: Add Agent types + BuilderAgent skeleton

**Files:**
- Create: `amio-app/src/world3d/agents/types.ts`
- Create: `amio-app/src/world3d/agents/BuilderAgent.ts`

**Step 1: Define types**

- `BuildTask`：id/type/name/position
- `PatrolRoute`：Vector3[]

**Step 2: Implement BuilderAgent public API**

Target API:

```ts
export interface BuilderAgentTickContext {
  deltaSeconds: number;
  nowMs: number;
}

export class BuilderAgent {
  public constructor(options: { id: string; name: string; mesh: Mesh; buildingManager: BuildingManager; patrolRoute: Vector3[] });
  public fixedTick(context: BuilderAgentTickContext): void;
  public frameUpdate(deltaSeconds: number): void;
  public assignBuildTask(task: BuildTask): void;
  public hasBuildTask(): boolean;
  public getStatusText(): string;
}
```

**Step 3: Commit**

```bash
git add amio-app/src/world3d/agents/types.ts amio-app/src/world3d/agents/BuilderAgent.ts
git commit -m "feat(world3d): add BuilderAgent skeleton and types"
```

---

### Task 11: Implement BuilderAgent behavior tree (build/patrol/idle)

**Files:**
- Modify: `amio-app/src/world3d/agents/BuilderAgent.ts`

**Step 1: Assemble behavior tree**

- 使用 `SelectorNode / SequenceNode / ConditionNode / ActionNode` 组合出文档中的树。
- `MoveTo` action：设置 `moveTarget`，当距离 < stopDistance 返回 Success，否则 Running。
- `Build` action：创建 building site（首次），每 tick `progress += BUILD_PROGRESS_PER_TICK`，更新 label；>=1 时 complete。

**Step 2: Implement frame movement**

- 每帧根据 `moveTarget` 计算位移，使用 `mesh.moveWithCollisions()`
- 旋转朝向移动方向
- 保持 y 在地面高度

**Step 3: Manual verify (still not wired globally)**

可先在 `WorldRuntime.start()` 临时创建 1 个 BuilderAgent，给它一个 build task，确认能“走过去建造”。

Run: `npm run dev:h5`

Expected: 机器人移动到目标点，进度增长，完成后建筑实体出现

**Step 4: Commit**

```bash
git add amio-app/src/world3d/agents/BuilderAgent.ts
git commit -m "feat(world3d): implement BuilderAgent behavior tree"
```

---

### Task 12: Add AgentManager (spawn 5-10 agents + task pool)

**Files:**
- Create: `amio-app/src/world3d/agents/AgentManager.ts`

**Step 1: Implement manager**

- `constructor(scene, buildingManager)`：创建 N 个 agent mesh（几何体占位，启用 collisions）
- 为每个 agent 配 patrol route（4-6 个点）
- 创建 build task pool（3-8 个任务点，确保互不重叠）
- `fixedTick(dt, nowMs)`：
  - tick 所有 agents
  - 给空闲 agents 分配任务（加入随机/冷却以“间歇建造”）
- `frameUpdate(frameDt)`：调用 agents 的 frameUpdate

**Step 2: Commit**

```bash
git add amio-app/src/world3d/agents/AgentManager.ts
git commit -m "feat(world3d): add AgentManager with spawn, patrol, and task pool"
```

---

### Task 13: Add WorldState (serialization scaffolding)

**Files:**
- Create: `amio-app/src/world3d/world/types.ts`
- Create: `amio-app/src/world3d/world/WorldState.ts`

**Step 1: Define JSON types**

- `Vector3JSON`, `AgentStateJSON`, `BuildingStateJSON`, `WorldStateJSON`

**Step 2: Implement toJSON/fromJSON**

- `WorldState` 内部持有 agents/buildings 的轻量状态（不含 Babylon mesh）
- managers 在 fixedTick 后写回状态（MVP：只写必要字段）

**Step 3: Commit**

```bash
git add amio-app/src/world3d/world/types.ts amio-app/src/world3d/world/WorldState.ts
git commit -m "feat(world3d): add WorldState serialization scaffold"
```

---

### Task 14: Wire fixed tick + managers into WorldRuntime

**Files:**
- Modify: `amio-app/src/world3d/runtime/WorldRuntime.ts`
- (Optional) Modify: `amio-app/src/world3d/constants.ts`

**Step 1: Add fields**

- `worldTickAccumulatorSeconds`
- `buildingManager`, `agentManager`, `worldState`

**Step 2: In start() create managers**

- after `this.scene` created: `this.buildingManager = new BuildingManager(this.scene)` etc.

**Step 3: In renderLoop add accumulator loop**

- 每帧：累积 dt
- while accumulator >= 0.2：
  - `agentManager.fixedTick(0.2, nowMs)`
  - `buildingManager.fixedTick(0.2, nowMs)`
  - `worldState.syncFromManagers(...)`（如需要）
- 每帧：`agentManager.frameUpdate(frameDt)`

**Step 4: Ensure stop() disposes**

- `agentManager.dispose()` / `buildingManager.dispose()`（即使 scene.dispose() 会清理，也要显式释放引用避免悬挂）

**Step 5: Verification**

Run unit tests: `npm run test:unit -- --testPathPattern=world3d/behaviorTree`

Expected: PASS

Run E2E: `npm run test:e2e:world`

Expected: PASS

Manual: `npm run dev:h5` 进入 world 页面观察 30 秒

Expected:
- 5-10 个机器人移动
- 30 秒内至少一次建造流程可见（进度变化 + 完成）
- Console 无 error

**Step 6: Commit**

```bash
git add amio-app/src/world3d/runtime/WorldRuntime.ts amio-app/src/world3d/constants.ts
git commit -m "feat(world3d): run local agents and buildings on fixed tick"
```

---

## Done Definition (Sprint 2)

- Sprint 2 验收清单全部满足（见设计文档）。
- `npm run test:unit` 全绿。
- `npm run test:e2e:world` 全绿。
