export interface MoveInputVector {
  x: number;
  z: number;
}

const normalizeMoveVector = (vector: MoveInputVector): MoveInputVector => {
  const length = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
  if (length <= 1) {
    return vector;
  }

  return {
    x: vector.x / length,
    z: vector.z / length,
  };
};

export const composeMoveInput = (
  keyboardInput: MoveInputVector,
  joystickInput: MoveInputVector,
  joystickActive: boolean
): MoveInputVector => {
  const combinedVector: MoveInputVector = {
    x: keyboardInput.x + (joystickActive ? joystickInput.x : 0),
    z: keyboardInput.z + (joystickActive ? joystickInput.z : 0),
  };

  return normalizeMoveVector(combinedVector);
};
