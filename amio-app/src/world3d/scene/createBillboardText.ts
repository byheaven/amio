import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';

const TEXTURE_WIDTH = 512;
const TEXTURE_HEIGHT = 256;
const LINE_HEIGHT = 56;

export interface BillboardText {
  mesh: Mesh;
  setText: (text: string) => void;
  dispose: () => void;
}

export interface CreateBillboardTextOptions {
  width: number;
  height: number;
  font: string;
  textColor: string;
  backgroundColor: string;
  emissiveColor?: Color3;
  offset?: Vector3;
  parent?: TransformNode;
}

export const createBillboardText = (
  scene: Scene,
  name: string,
  options: CreateBillboardTextOptions
): BillboardText => {
  const plane = CreatePlane(name, { width: options.width, height: options.height }, scene);
  plane.isPickable = false;
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
  if (options.offset) {
    plane.position.copyFrom(options.offset);
  }
  if (options.parent) {
    plane.parent = options.parent;
  }

  const texture = new DynamicTexture(
    `${name}-texture`,
    { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT },
    scene,
    true
  );
  texture.hasAlpha = true;

  const material = new StandardMaterial(`${name}-material`, scene);
  material.diffuseTexture = texture;
  material.opacityTexture = texture;
  material.emissiveColor = options.emissiveColor ?? new Color3(1, 1, 1);
  material.specularColor = Color3.Black();
  material.backFaceCulling = false;
  plane.material = material;

  let lastText = '';
  const setText = (text: string): void => {
    if (text === lastText) {
      return;
    }
    lastText = text;

    const context = texture.getContext() as unknown as CanvasRenderingContext2D;
    context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    context.font = options.font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = options.textColor;

    const lines = text.split('\n');
    const totalHeight = lines.length * LINE_HEIGHT;
    const startY = (TEXTURE_HEIGHT - totalHeight) / 2 + LINE_HEIGHT / 2;
    lines.forEach((line, index) => {
      const drawY = startY + index * LINE_HEIGHT;
      context.fillText(line, TEXTURE_WIDTH / 2, drawY);
    });

    texture.update(true);
  };

  return {
    mesh: plane,
    setText,
    dispose: () => {
      plane.dispose();
      texture.dispose();
      material.dispose();
    },
  };
};
