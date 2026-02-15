import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Axis } from '@babylonjs/core/Maths/math.axis';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import {
  PLAYER_GRAVITY,
  PLAYER_GROUND_HEIGHT,
  PLAYER_MOVE_SPEED,
  WORLD_MOVEMENT_LIMIT,
} from '../constants';
import { MoveInputVector } from '../input/composeMoveInput';

export interface PlayerMotionState {
  verticalVelocity: number;
}

export interface UpdatePlayerOptions {
  camera: ArcRotateCamera;
  deltaSeconds: number;
  input: MoveInputVector;
  player: Mesh;
  motionState: PlayerMotionState;
}

const getMovementDirection = (
  camera: ArcRotateCamera,
  input: MoveInputVector
): Vector3 => {
  const cameraForward = camera.getTarget().subtract(camera.position);
  cameraForward.y = 0;
  if (cameraForward.lengthSquared() < 0.0001) {
    cameraForward.copyFromFloats(0, 0, 1);
  }
  cameraForward.normalize();

  const cameraRight = Vector3.Cross(Axis.Y, cameraForward);
  cameraRight.normalize();

  const movementDirection = cameraRight.scale(input.x).add(cameraForward.scale(input.z));
  if (movementDirection.lengthSquared() > 1) {
    movementDirection.normalize();
  }

  return movementDirection;
};

export const updatePlayer = ({
  camera,
  deltaSeconds,
  input,
  player,
  motionState,
}: UpdatePlayerOptions): void => {
  const movementDirection = getMovementDirection(camera, input);
  const horizontalDisplacement = movementDirection.scale(PLAYER_MOVE_SPEED * deltaSeconds);

  motionState.verticalVelocity += PLAYER_GRAVITY * deltaSeconds;
  const verticalDisplacement = motionState.verticalVelocity * deltaSeconds;

  player.moveWithCollisions(
    new Vector3(horizontalDisplacement.x, verticalDisplacement, horizontalDisplacement.z)
  );

  if (player.position.y < PLAYER_GROUND_HEIGHT) {
    player.position.y = PLAYER_GROUND_HEIGHT;
    motionState.verticalVelocity = 0;
  }

  player.position.x = Math.max(-WORLD_MOVEMENT_LIMIT, Math.min(WORLD_MOVEMENT_LIMIT, player.position.x));
  player.position.z = Math.max(-WORLD_MOVEMENT_LIMIT, Math.min(WORLD_MOVEMENT_LIMIT, player.position.z));

  if (movementDirection.lengthSquared() > 0.0001) {
    player.rotation.y = Math.atan2(movementDirection.x, movementDirection.z);
  }
};
