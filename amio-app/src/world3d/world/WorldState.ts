import { BuilderAgentSnapshot } from '../agents/types';
import { BuildingSnapshot } from '../buildings/types';
import {
  AgentStateJSON,
  BuildingStateJSON,
  Vector3JSON,
  WorldStateJSON,
} from './types';

const toVector3JSON = (vector: { x: number; y: number; z: number }): Vector3JSON => ({
  x: vector.x,
  y: vector.y,
  z: vector.z,
});

const cloneAgentState = (agent: AgentStateJSON): AgentStateJSON => ({
  ...agent,
  position: { ...agent.position },
});

const cloneBuildingState = (building: BuildingStateJSON): BuildingStateJSON => ({
  ...building,
  position: { ...building.position },
});

export class WorldState {
  private state: WorldStateJSON = {
    version: 1,
    agents: [],
    buildings: [],
  };

  public constructor(initialState?: WorldStateJSON) {
    if (initialState) {
      this.fromJSON(initialState);
    }
  }

  public sync(agents: BuilderAgentSnapshot[], buildings: BuildingSnapshot[]): void {
    this.state = {
      version: 1,
      agents: agents.map((agent) => {
        const result: AgentStateJSON = {
          id: agent.id,
          name: agent.name,
          position: toVector3JSON(agent.position),
          rotationY: agent.rotationY,
          mode: agent.mode,
          statusText: agent.statusText,
        };

        if (agent.taskId) {
          result.taskId = agent.taskId;
        }
        if (typeof agent.buildProgress === 'number') {
          result.buildProgress = agent.buildProgress;
        }

        return result;
      }),
      buildings: buildings.map((building) => ({
        id: building.id,
        type: building.type,
        name: building.name,
        position: toVector3JSON(building.position),
        rotationY: building.rotationY,
        progress: building.progress,
        status: building.status,
        createdAtMs: building.createdAtMs,
        requestedBy: building.requestedBy,
      })),
    };
  }

  public toJSON(): WorldStateJSON {
    return {
      version: 1,
      agents: this.state.agents.map(cloneAgentState),
      buildings: this.state.buildings.map(cloneBuildingState),
    };
  }

  public fromJSON(data: WorldStateJSON): void {
    this.state = {
      version: 1,
      agents: data.agents.map(cloneAgentState),
      buildings: data.buildings.map(cloneBuildingState),
    };
  }
}
