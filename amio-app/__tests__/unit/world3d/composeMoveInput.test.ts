import { composeMoveInput } from '@/world3d/input/composeMoveInput';

describe('composeMoveInput', () => {
  it('returns keyboard input when joystick is inactive', () => {
    const result = composeMoveInput(
      { x: 1, z: 0 },
      { x: -1, z: 1 },
      false
    );

    expect(result).toEqual({ x: 1, z: 0 });
  });

  it('normalizes diagonal keyboard input', () => {
    const result = composeMoveInput(
      { x: 1, z: 1 },
      { x: 0, z: 0 },
      false
    );

    expect(result.x).toBeCloseTo(0.7071, 3);
    expect(result.z).toBeCloseTo(0.7071, 3);
  });

  it('normalizes combined keyboard and joystick input', () => {
    const result = composeMoveInput(
      { x: 1, z: 0 },
      { x: 0.8, z: 0.8 },
      true
    );

    expect(result.x * result.x + result.z * result.z).toBeCloseTo(1, 4);
  });

  it('returns zero vector when both inputs are neutral', () => {
    const result = composeMoveInput(
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      false
    );

    expect(result).toEqual({ x: 0, z: 0 });
  });
});
