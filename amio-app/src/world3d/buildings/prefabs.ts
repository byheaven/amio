import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import { BuildingType } from './types';

export interface BuildingPrefab {
  root: TransformNode;
  meshes: Mesh[];
}

const createPartMaterial = (
  scene: Scene,
  name: string,
  diffuse: Color3,
  emissive: Color3 = new Color3(0, 0, 0)
): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = diffuse;
  material.emissiveColor = emissive;
  material.specularColor = new Color3(0.1, 0.12, 0.15);
  return material;
};

const enableBuildingCollisions = (meshes: Mesh[]): void => {
  meshes.forEach((mesh) => {
    mesh.checkCollisions = true;
    mesh.isPickable = true;
  });
};

const createMonumentPrefab = (scene: Scene, root: TransformNode, name: string): Mesh[] => {
  const base = CreateCylinder(`${name}-base`, { diameter: 4.8, height: 1.2, tessellation: 8 }, scene);
  base.position = new Vector3(0, 0.6, 0);
  base.parent = root;
  base.material = createPartMaterial(scene, `${name}-base-material`, new Color3(0.35, 0.47, 0.63));

  const pillar = CreateCylinder(
    `${name}-pillar`,
    { diameterTop: 1.7, diameterBottom: 2.3, height: 5.6, tessellation: 8 },
    scene
  );
  pillar.position = new Vector3(0, 3.8, 0);
  pillar.parent = root;
  pillar.material = createPartMaterial(scene, `${name}-pillar-material`, new Color3(0.48, 0.65, 0.86));

  const top = CreateSphere(`${name}-top`, { diameter: 1.3, segments: 6 }, scene);
  top.position = new Vector3(0, 6.95, 0);
  top.parent = root;
  top.material = createPartMaterial(
    scene,
    `${name}-top-material`,
    new Color3(0.82, 0.9, 0.99),
    new Color3(0.08, 0.1, 0.14)
  );

  return [base, pillar, top];
};

const createHousePrefab = (scene: Scene, root: TransformNode, name: string): Mesh[] => {
  const foundation = CreateBox(`${name}-foundation`, { width: 5.4, depth: 4.8, height: 0.7 }, scene);
  foundation.position = new Vector3(0, 0.35, 0);
  foundation.parent = root;
  foundation.material = createPartMaterial(scene, `${name}-foundation-material`, new Color3(0.25, 0.35, 0.45));

  const body = CreateBox(`${name}-body`, { width: 4.6, depth: 4, height: 3.2 }, scene);
  body.position = new Vector3(0, 2.3, 0);
  body.parent = root;
  body.material = createPartMaterial(scene, `${name}-body-material`, new Color3(0.74, 0.86, 0.97));

  const roof = CreateCylinder(
    `${name}-roof`,
    { diameterTop: 0.2, diameterBottom: 5.8, height: 2.2, tessellation: 4 },
    scene
  );
  roof.position = new Vector3(0, 4.9, 0);
  roof.rotation.y = Math.PI / 4;
  roof.parent = root;
  roof.material = createPartMaterial(scene, `${name}-roof-material`, new Color3(0.91, 0.54, 0.49));

  return [foundation, body, roof];
};

const createGardenPrefab = (scene: Scene, root: TransformNode, name: string): Mesh[] => {
  const floor = CreateCylinder(`${name}-floor`, { diameter: 5.5, height: 0.5, tessellation: 10 }, scene);
  floor.position = new Vector3(0, 0.25, 0);
  floor.parent = root;
  floor.material = createPartMaterial(scene, `${name}-floor-material`, new Color3(0.22, 0.42, 0.3));

  const statue = CreateCylinder(
    `${name}-statue`,
    { diameterTop: 0.7, diameterBottom: 1.2, height: 3.2, tessellation: 8 },
    scene
  );
  statue.position = new Vector3(0, 2.1, 0);
  statue.parent = root;
  statue.material = createPartMaterial(scene, `${name}-statue-material`, new Color3(0.63, 0.82, 0.73));

  const statueTop = CreateSphere(`${name}-statue-top`, { diameter: 1.1, segments: 6 }, scene);
  statueTop.position = new Vector3(0, 3.95, 0);
  statueTop.parent = root;
  statueTop.material = createPartMaterial(scene, `${name}-statue-top-material`, new Color3(0.78, 0.92, 0.84));

  const ring = CreateCylinder(`${name}-ring`, { diameter: 4.8, height: 0.35, tessellation: 10 }, scene);
  ring.position = new Vector3(0, 0.7, 0);
  ring.parent = root;
  ring.material = createPartMaterial(scene, `${name}-ring-material`, new Color3(0.38, 0.67, 0.5));

  return [floor, statue, statueTop, ring];
};

export const createBuildingPrefab = (
  scene: Scene,
  type: BuildingType,
  name: string
): BuildingPrefab => {
  const root = new TransformNode(`${name}-root`, scene);

  let meshes: Mesh[];
  if (type === 'monument') {
    meshes = createMonumentPrefab(scene, root, name);
  } else if (type === 'house') {
    meshes = createHousePrefab(scene, root, name);
  } else {
    meshes = createGardenPrefab(scene, root, name);
  }

  enableBuildingCollisions(meshes);
  return { root, meshes };
};
