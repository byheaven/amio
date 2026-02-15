import { MoveInputVector } from './composeMoveInput';

const FORWARD_KEYS = new Set(['w', 'arrowup']);
const BACKWARD_KEYS = new Set(['s', 'arrowdown']);
const LEFT_KEYS = new Set(['a', 'arrowleft']);
const RIGHT_KEYS = new Set(['d', 'arrowright']);

export class KeyboardInput {
  private readonly pressedKeys = new Set<string>();
  private started = false;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.key.toLowerCase());
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.key.toLowerCase());
  };

  public start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.started = true;
  }

  public stop(): void {
    if (!this.started || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.pressedKeys.clear();
    this.started = false;
  }

  public getMoveVector(): MoveInputVector {
    let moveX = 0;
    let moveZ = 0;

    if (this.hasAnyPressed(LEFT_KEYS)) {
      moveX -= 1;
    }
    if (this.hasAnyPressed(RIGHT_KEYS)) {
      moveX += 1;
    }
    if (this.hasAnyPressed(FORWARD_KEYS)) {
      moveZ += 1;
    }
    if (this.hasAnyPressed(BACKWARD_KEYS)) {
      moveZ -= 1;
    }

    return { x: moveX, z: moveZ };
  }

  private hasAnyPressed(keys: Set<string>): boolean {
    for (const key of keys) {
      if (this.pressedKeys.has(key)) {
        return true;
      }
    }

    return false;
  }
}
