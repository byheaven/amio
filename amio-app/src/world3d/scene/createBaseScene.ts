import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import {
  PLAYER_GROUND_HEIGHT,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  WORLD_HALF_SIZE,
  WORLD_SIZE,
} from '../constants';

export interface BaseSceneParts {
  camera: ArcRotateCamera;
  player: Mesh;
  scene: Scene;
}

const createGround = (scene: Scene): void => {
  const ground = CreateGround(
    'world-ground',
    { width: WORLD_SIZE, height: WORLD_SIZE, subdivisions: 16 },
    scene
  );
  const groundMaterial = new StandardMaterial('world-ground-material', scene);
  groundMaterial.diffuseColor = new Color3(0.15, 0.29, 0.44);
  groundMaterial.specularColor = new Color3(0.03, 0.05, 0.08);
  ground.material = groundMaterial;
  ground.checkCollisions = true;
  ground.isPickable = false;
};

const createSky = (scene: Scene): void => {
  const skybox = CreateBox('world-skybox', { size: 650 }, scene);
  const skyMaterial = new StandardMaterial('world-skybox-material', scene);
  skyMaterial.backFaceCulling = false;
  skyMaterial.disableLighting = true;
  skyMaterial.diffuseColor = new Color3(0.03, 0.05, 0.13);
  skyMaterial.emissiveColor = new Color3(0.05, 0.08, 0.18);
  skyMaterial.specularColor = Color3.Black();
  skybox.material = skyMaterial;
  skybox.isPickable = false;

  const starMaterial = new StandardMaterial('world-star-material', scene);
  starMaterial.disableLighting = true;
  starMaterial.emissiveColor = new Color3(0.95, 0.97, 1);
  starMaterial.specularColor = Color3.Black();

  for (let index = 0; index < 120; index += 1) {
    const star = CreateSphere(
      `world-star-${index}`,
      { diameter: 0.4, segments: 4 },
      scene
    );
    const distance = 180 + Math.random() * 140;
    const azimuth = Math.random() * Math.PI * 2;
    const elevation = Math.random() * Math.PI * 0.7;
    star.position = new Vector3(
      Math.cos(azimuth) * Math.cos(elevation) * distance,
      35 + Math.sin(elevation) * distance * 0.4,
      Math.sin(azimuth) * Math.cos(elevation) * distance
    );
    star.material = starMaterial;
    star.isPickable = false;
  }
};

const createBoundaryWalls = (scene: Scene): void => {
  const wallDefinitions = [
    { width: WORLD_SIZE + 2, depth: 2, x: 0, z: WORLD_HALF_SIZE },
    { width: WORLD_SIZE + 2, depth: 2, x: 0, z: -WORLD_HALF_SIZE },
    { width: 2, depth: WORLD_SIZE + 2, x: WORLD_HALF_SIZE, z: 0 },
    { width: 2, depth: WORLD_SIZE + 2, x: -WORLD_HALF_SIZE, z: 0 },
  ];

  wallDefinitions.forEach((definition, index) => {
    const wall = CreateBox(
      `world-boundary-wall-${index}`,
      { width: definition.width, height: 8, depth: definition.depth },
      scene
    );
    wall.position = new Vector3(definition.x, 4, definition.z);
    wall.checkCollisions = true;
    wall.isVisible = false;
    wall.isPickable = false;
  });
};

const createWorldObstacles = (scene: Scene): void => {
  const obstacleMaterial = new StandardMaterial('world-obstacle-material', scene);
  obstacleMaterial.diffuseColor = new Color3(0.2, 0.35, 0.55);
  obstacleMaterial.specularColor = new Color3(0.02, 0.04, 0.06);

  const obstacleDefinitions = [
    { width: 6, depth: 6, height: 4, x: 20, z: -12 },
    { width: 8, depth: 5, height: 3, x: -24, z: 15 },
    { width: 5, depth: 7, height: 5, x: 6, z: 24 },
    { width: 9, depth: 4, height: 3.5, x: -8, z: -20 },
  ];

  obstacleDefinitions.forEach((definition, index) => {
    const obstacle = CreateBox(
      `world-obstacle-${index}`,
      {
        width: definition.width,
        depth: definition.depth,
        height: definition.height,
      },
      scene
    );
    obstacle.position = new Vector3(definition.x, definition.height / 2, definition.z);
    obstacle.material = obstacleMaterial;
    obstacle.checkCollisions = true;
    obstacle.isPickable = false;
  });
};

const createPlayer = (scene: Scene): Mesh => {
  const player = CreateCapsule(
    'world-player',
    {
      height: PLAYER_HEIGHT,
      radius: PLAYER_RADIUS,
      tessellation: 8,
    },
    scene
  );

  const playerMaterial = new StandardMaterial('world-player-material', scene);
  playerMaterial.diffuseColor = new Color3(0.25, 0.58, 0.9);
  playerMaterial.emissiveColor = new Color3(0.04, 0.1, 0.2);
  playerMaterial.specularColor = new Color3(0.1, 0.2, 0.3);
  player.material = playerMaterial;

  player.position = new Vector3(0, PLAYER_GROUND_HEIGHT, 0);
  player.checkCollisions = true;
  player.isPickable = false;
  player.ellipsoid = new Vector3(PLAYER_RADIUS, PLAYER_HEIGHT / 2, PLAYER_RADIUS);
  player.ellipsoidOffset = new Vector3(0, PLAYER_HEIGHT / 2, 0);

  return player;
};

const createCamera = (
  scene: Scene,
  canvas: HTMLCanvasElement,
  target: Vector3
): ArcRotateCamera => {
  const camera = new ArcRotateCamera(
    'world-camera',
    -Math.PI / 2,
    1.05,
    12,
    target,
    scene
  );

  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 18;
  camera.lowerBetaLimit = 0.3;
  camera.upperBetaLimit = 1.9;
  camera.panningSensibility = 0;
  camera.wheelDeltaPercentage = 0.01;
  camera.inertia = 0.65;
  camera.attachControl(canvas, true);

  return camera;
};

const createLighting = (scene: Scene): void => {
  const hemiLight = new HemisphericLight('world-hemi-light', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.95;
  hemiLight.diffuse = new Color3(0.62, 0.76, 0.96);
  hemiLight.groundColor = new Color3(0.1, 0.16, 0.22);

  const directionalLight = new DirectionalLight(
    'world-directional-light',
    new Vector3(-0.4, -1, -0.35),
    scene
  );
  directionalLight.position = new Vector3(30, 60, 30);
  directionalLight.intensity = 0.8;
  directionalLight.diffuse = new Color3(0.95, 0.98, 1);
};

export const createBaseScene = (
  engine: Engine,
  canvas: HTMLCanvasElement
): BaseSceneParts => {
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  scene.clearColor = new Color4(0.03, 0.05, 0.12, 1);

  createLighting(scene);
  createSky(scene);
  createGround(scene);
  createBoundaryWalls(scene);
  createWorldObstacles(scene);

  const player = createPlayer(scene);
  const camera = createCamera(scene, canvas, player.position.clone().add(new Vector3(0, 1.1, 0)));

  return {
    camera,
    player,
    scene,
  };
};
