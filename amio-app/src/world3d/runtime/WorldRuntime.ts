import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Collisions/collisionCoordinator';
import { Engine } from '@babylonjs/core/Engines/engine';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { composeMoveInput, MoveInputVector } from '../input/composeMoveInput';
import { KeyboardInput } from '../input/KeyboardInput';
import { updatePlayer, PlayerMotionState } from '../player/updatePlayer';
import { createBaseScene } from '../scene/createBaseScene';
import { WorldRuntimeOptions } from './types';

const CAMERA_TARGET_OFFSET = new Vector3(0, 1.1, 0);
const CAMERA_FOLLOW_STRENGTH = 7;
const MAX_FRAME_DELTA_SECONDS = 0.05;

export class WorldRuntime {
  private readonly container: HTMLElement;
  private readonly options: WorldRuntimeOptions;
  private readonly keyboardInput = new KeyboardInput();
  private readonly playerMotionState: PlayerMotionState = { verticalVelocity: 0 };

  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private player: Mesh | null = null;

  private joystickInput: MoveInputVector = { x: 0, z: 0 };
  private joystickActive = false;
  private started = false;
  private resizeObserver: ResizeObserver | null = null;

  public constructor(container: HTMLElement, options: WorldRuntimeOptions = {}) {
    this.container = container;
    this.options = options;
  }

  public start(): void {
    if (this.started || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'world-runtime-canvas';
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.touchAction = 'none';
    this.container.appendChild(this.canvas);

    const antialias = window.innerWidth > 768;
    this.engine = new Engine(
      this.canvas,
      antialias,
      { preserveDrawingBuffer: false, stencil: true },
      true
    );

    const baseScene = createBaseScene(this.engine, this.canvas);
    this.scene = baseScene.scene;
    this.camera = baseScene.camera;
    this.player = baseScene.player;

    this.keyboardInput.start();
    this.resizeEngineToContainer();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.resizeEngineToContainer);
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('resize', this.resizeEngineToContainer);
    this.engine.runRenderLoop(this.renderLoop);

    // Layout in Taro H5 can settle after mount; run one post-layout resize.
    window.requestAnimationFrame(() => {
      this.resizeEngineToContainer();
    });

    this.started = true;
    this.options.onLoaded?.();
  }

  public stop(): void {
    if (!this.started || typeof window === 'undefined') {
      return;
    }

    this.keyboardInput.stop();
    window.removeEventListener('resize', this.resizeEngineToContainer);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.engine) {
      this.engine.stopRenderLoop(this.renderLoop);
    }
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.engine) {
      this.engine.dispose();
    }
    if (this.canvas && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }

    this.scene = null;
    this.camera = null;
    this.player = null;
    this.engine = null;
    this.canvas = null;
    this.started = false;
  }

  public dispose(): void {
    this.stop();
  }

  public setJoystickInput(vector: MoveInputVector, active: boolean): void {
    this.joystickInput = vector;
    this.joystickActive = active;
  }

  private readonly resizeEngineToContainer = (): void => {
    if (!this.engine) {
      return;
    }

    const width = Math.max(1, this.container.clientWidth || window.innerWidth || 1);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight || 1);
    this.engine.setSize(width, height);
  };

  private readonly renderLoop = (): void => {
    if (!this.engine || !this.scene || !this.camera || !this.player) {
      return;
    }

    const deltaSeconds = Math.min(this.engine.getDeltaTime() / 1000, MAX_FRAME_DELTA_SECONDS);
    const keyboardInput = this.keyboardInput.getMoveVector();
    const moveInput = composeMoveInput(keyboardInput, this.joystickInput, this.joystickActive);

    updatePlayer({
      camera: this.camera,
      deltaSeconds,
      input: moveInput,
      player: this.player,
      motionState: this.playerMotionState,
    });

    const desiredCameraTarget = this.player.position.add(CAMERA_TARGET_OFFSET);
    const currentCameraTarget = this.camera.getTarget();
    const followAlpha = 1 - Math.exp(-CAMERA_FOLLOW_STRENGTH * deltaSeconds);
    const smoothTarget = Vector3.Lerp(currentCameraTarget, desiredCameraTarget, followAlpha);
    this.camera.setTarget(smoothTarget);

    this.scene.render();
  };
}
