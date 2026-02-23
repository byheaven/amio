import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { WorldPicker, WorldPickerOptions } from '@/world3d/interaction/WorldPicker';
import { BuildingSnapshot } from '@/world3d/buildings/types';
import { BuilderAgent } from '@/world3d/agents/BuilderAgent';

interface PickerHarness {
  canvas: HTMLCanvasElement;
  sceneMultiPick: jest.Mock;
  onAgentPicked: jest.Mock;
  onBuildingPicked: jest.Mock;
  onBuildingUnavailable: jest.Mock;
}

const createRect = (): DOMRect => (
  {
    x: 10,
    y: 20,
    width: 300,
    height: 200,
    top: 20,
    right: 310,
    bottom: 220,
    left: 10,
    toJSON: () => ({}),
  } as DOMRect
);

const createAgent = (): BuilderAgent => (
  {
    getPosition: () => new Vector3(0, 0, 0),
    getSnapshot: () => ({ id: 'agent-1', name: 'Builder-01' }),
    isInConversation: () => false,
    getConversationUserId: () => null,
  } as unknown as BuilderAgent
);

const createHarness = (buildings: BuildingSnapshot[] = []): PickerHarness => {
  const canvas = document.createElement('canvas');
  const rect = createRect();
  canvas.getBoundingClientRect = jest.fn(() => rect);

  const sceneMultiPick = jest.fn();
  const onAgentPicked = jest.fn();
  const onBuildingPicked = jest.fn();
  const onBuildingUnavailable = jest.fn();

  const agent = createAgent();
  const options: WorldPickerOptions = {
    scene: {
      getEngine: () => ({
        getRenderingCanvas: () => canvas,
        getHardwareScalingLevel: () => 1,
        getRenderWidth: () => 300,
        getRenderHeight: () => 200,
      }),
      multiPick: sceneMultiPick,
    } as never,
    agentManager: {
      findAgentByMeshName: jest.fn((meshName: string) => (meshName === 'builder-agent-1' ? agent : null)),
    } as never,
    buildingManager: {
      getSnapshots: jest.fn(() => buildings),
    } as never,
    getPlayerPosition: () => new Vector3(0, 0, 0),
    getCurrentUserId: () => 'user-1',
    onAgentPicked,
    onBuildingPicked,
    onBuildingUnavailable,
    onTooFar: jest.fn(),
    onAgentBusy: jest.fn(),
  };

  new WorldPicker(options);

  return {
    canvas,
    sceneMultiPick,
    onAgentPicked,
    onBuildingPicked,
    onBuildingUnavailable,
  };
};

describe('WorldPicker', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('uses CSS-local coordinates when calling scene.multiPick', () => {
    const harness = createHarness();
    harness.sceneMultiPick.mockReturnValue([]);

    harness.canvas.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: 160,
        clientY: 120,
      }),
    );

    expect(harness.sceneMultiPick).toHaveBeenCalledWith(
      150,
      100,
      expect.any(Function),
    );
  });

  test('prioritizes bot hit over building hit when both overlap', () => {
    const harness = createHarness([
      {
        id: 'building-1',
        type: 'house',
        name: 'house-1',
        position: new Vector3(0, 0, 0),
        rotationY: 0,
        progress: 1,
        status: 'complete',
        createdAtMs: Date.now(),
        requestedBy: 'system',
      },
    ]);

    harness.sceneMultiPick.mockReturnValue([
      {
        hit: true,
        distance: 1,
        pickedMesh: { name: 'building-1-body' },
      },
      {
        hit: true,
        distance: 2,
        pickedMesh: { name: 'builder-agent-1' },
      },
    ]);

    harness.canvas.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: 160,
        clientY: 120,
      }),
    );

    expect(harness.onAgentPicked).toHaveBeenCalledTimes(1);
    expect(harness.onBuildingPicked).not.toHaveBeenCalled();
  });

  test('reports under-construction buildings instead of failing silently', () => {
    const harness = createHarness([
      {
        id: 'building-3',
        type: 'monument',
        name: 'monument-3',
        position: new Vector3(0, 0, 0),
        rotationY: 0,
        progress: 0.45,
        status: 'building',
        createdAtMs: Date.now(),
        requestedBy: 'user-1',
      },
    ]);

    harness.sceneMultiPick.mockReturnValue([
      {
        hit: true,
        distance: 1,
        pickedMesh: { name: 'building-3-top' },
      },
    ]);

    harness.canvas.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: 160,
        clientY: 120,
      }),
    );

    expect(harness.onBuildingUnavailable).toHaveBeenCalledWith('under_construction');
    expect(harness.onBuildingPicked).not.toHaveBeenCalled();
  });
});
