import { WorldRuntime } from '@/world3d/runtime/WorldRuntime';

describe('WorldRuntime resize behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('converts CSS size to render size using hardware scaling level', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 390 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 844 });

    const runtime = new WorldRuntime(container);
    const setSize = jest.fn();
    const privateRuntime = runtime as unknown as {
      engine: {
        getHardwareScalingLevel: () => number;
        setSize: (width: number, height: number) => void;
      } | null;
      resizeEngineToContainer: () => void;
    };

    privateRuntime.engine = {
      getHardwareScalingLevel: () => 0.5,
      setSize,
    };

    privateRuntime.resizeEngineToContainer();

    expect(setSize).toHaveBeenCalledWith(780, 1688);
  });
});
