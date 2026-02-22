---
projects:
  - "[[AMIO]]"
tags:
  - cc
  - sharkstar
  - 3dworld
  - design
---

# SharkStar 3D World Sprint 2 Design (Local Single-User)

**目标（Sprint 2 验收口径）**

- 进入 3D 世界后能看到 5-10 个 AI Builder 机器人在场景中自主移动。
- 每隔一段时间有机器人走到空地开始建造；建造过程中可见进度；建造完成后出现一座建筑。
- 本 Sprint 仅做“单用户 + 本地运行”，不接入 Node 世界服务器 / WebSocket / 持久化。

---

## 范围

**做**

- 行为树框架（Selector / Sequence / Condition / Action + Running/Success/Failure），并为基础节点补齐单元测试。
- Agent 系统：BuilderAgent + AgentManager（本地任务池、巡逻、待机、建造）。
- 建筑系统：BuildingManager（3 种几何体预制建筑 + 建造中/完成视觉状态 + 进度展示）。
- WorldState：定义并实现序列化/反序列化的数据结构（为 Sprint 4 持久化铺路）。
- WorldRuntime 固定 Tick（5Hz）+ 每帧渲染/插值（运动平滑）。

**不做**

- 多人同步、Socket.IO、服务端权威世界、REST API。
- 复杂寻路（A*）。仅做直线移动 + 简单“卡住回退/换点”的降级策略。
- 资产替换（glTF 模型）、复杂粒子/后处理。
- 与 AI 对话建造（Sprint 3）。

---

## 架构总览

现状：Sprint 1 已有 `WorldRuntime` + `createBaseScene` + 玩家移动（键盘/摇杆）+ 碰撞。

Sprint 2 在 `amio-app/src/world3d/` 内新增 4 个子系统，全部由 `WorldRuntime` 挂载并驱动。

```
WorldRuntime (renderLoop 每帧)
  |-- fixedTick (5Hz, accumulator 驱动)
  |     |-- AgentManager.fixedTick(dt)
  |     |-- BuildingManager.fixedTick(dt)
  |     |-- WorldState (同步快照)
  |
  |-- frameUpdate (每帧)
        |-- AgentManager.frameUpdate(frameDt)
        |-- (可选) BuildingManager.frameUpdate(frameDt)
        |-- scene.render()
```

### Tick 策略（推荐：固定步长 5Hz）

- 渲染：保持现有 `engine.runRenderLoop`，每帧渲染。
- 逻辑：在渲染循环里做 `accumulator`，以 `WORLD_TICK_SECONDS = 0.2` 固定步长驱动 AI 与建造进度。
- 运动：Agent “决策/目标更新”在 5Hz；实际移动/朝向在每帧 `frameUpdate()` 做平滑推进。

好处：行为树与建造进度不受 FPS 波动影响；逻辑更可测、可复现。

---

## 目录与模块边界

新增目录（建议结构）：

- `amio-app/src/world3d/behaviorTree/`：纯逻辑（无 Babylon 依赖），可单测。
- `amio-app/src/world3d/agents/`：Agent 状态机 + 行为树装配 + 简单移动控制。
- `amio-app/src/world3d/buildings/`：建筑实例、建造进度表现、预制体。
- `amio-app/src/world3d/world/`：WorldState（JSON 序列化口径）。
- `amio-app/src/world3d/scene/createBillboardText.ts`：3D 文本牌（DynamicTexture + Plane），供 Agent/建筑复用。

修改点：

- `amio-app/src/world3d/runtime/WorldRuntime.ts`：接入固定 tick + managers。
- （可选）`amio-app/src/world3d/constants.ts`：补充 tick/agent/build 常量。

---

## 数据结构（Sprint 4 可复用）

为后续持久化预留：Sprint 2 内就按 JSON 可序列化口径落类型。

```ts
// Vector3JSON
{ x: number; y: number; z: number }

// Building
{
  id: string;
  type: 'monument' | 'house' | 'garden';
  name: string;
  position: Vector3JSON;
  rotationY: number;
  progress: number; // 0..1
  status: 'building' | 'complete';
  createdAtMs: number;
  requestedBy: 'system';
}

// Agent
{
  id: string;
  name: string;
  position: Vector3JSON;
  rotationY: number;
  mode: 'idle' | 'patrol' | 'building';
  statusText: string;
  taskId?: string;
  buildProgress?: number;
}

// WorldState
{ version: 1; agents: Agent[]; buildings: Building[] }
```

---

## 行为树设计

**NodeStatus**：`Running | Success | Failure`

**节点类型**

- `SelectorNode`：从子节点依次 tick；遇到 Success 立即返回 Success；所有失败才 Failure；子节点 Running 则返回 Running 并记住运行位置。
- `SequenceNode`：从子节点依次 tick；遇到 Failure 立即返回 Failure；全部 Success 才 Success；子节点 Running 则返回 Running 并记住运行位置。
- `ConditionNode(fn)`：`fn(ctx) === true` → Success，否则 Failure。
- `ActionNode(fn)`：直接返回 fn(ctx) 的 NodeStatus（可用 closure 访问 Agent/BuildingManager）。

**约定**

- Composite 节点在最终返回 Success/Failure 时会 reset 自身运行索引；并对实现了 `reset()` 的子节点调用 reset（保证下一次从干净状态开始）。
- 行为树 ctx 最小包含：`deltaSeconds`、`nowMs`。

---

## Agent 系统设计

### Builder 行为树

```
Root (Selector)
  1) [有建造任务?] -> Sequence
       - MoveTo(buildPos)
       - Build(progress)
  2) [有巡逻路线?] -> Sequence
       - MoveTo(patrolPoint)
       - AdvancePatrolIndex
  3) [默认] -> Idle
```

### 移动策略（无复杂寻路）

- 目标：直线朝向目标点移动，使用 Babylon `moveWithCollisions()`。
- 卡住降级：若连续 N 次 fixedTick 距离没有变小（或变小不足阈值），判定卡住：
  - patrol：直接切换到下一个 patrol 点
  - build：放弃该任务并回收任务到池子末尾（避免永远占用）

---

## 建筑系统设计

### 预制体

Sprint 2 先提供 3 种：

- `monument`：柱体 + 底座
- `house`：盒子 + 屋顶三角楔形（可用两个 box 组合）
- `garden`：低矮围栏 + 中心小雕塑

### 建造状态

- 建造中：半透明（alpha ~0.35）+ 名称/进度 label（3D 文本牌）
- 完成：alpha = 1 + 轻微完成特效（例如 emissive flash 300ms + scaleIn）

---

## 3D 文本牌（不引入 @babylonjs/gui）

由于当前依赖未包含 `@babylonjs/gui`，Sprint 2 使用 `DynamicTexture + Plane` 实现:

- plane mesh：`billboardMode = Mesh.BILLBOARDMODE_ALL`
- dynamic texture：仅在文本变化时重绘（5Hz 或状态变更），避免每帧 draw

---

## 测试策略

**必做（文档要求）**：行为树基础节点单元测试

- `SelectorNode` / `SequenceNode`：覆盖 Running/Success/Failure，重点验证“Running 续跑（记住运行 child index）”。
- `ConditionNode` / `ActionNode`：覆盖返回值语义。

**建议**：保持 Babylon 相关逻辑在 Sprint 2 内以手动验收为主（H5 运行验证），避免在 Jest/jsdom 里引入 WebGL 依赖。

---

## Sprint 2 验收清单（可执行）

- `npm run dev:h5` 打开 world 页面，能看到多个机器人移动。
- 至少 1 个机器人在 30 秒内触发一次建造：移动到空地 → 显示“正在建造：xxx 42%” → 建造完成变为实体建筑。
- 全程无 console error；`amio-app/e2e/world-entry.spec.ts` 通过。
