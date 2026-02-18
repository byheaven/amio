const mockPlaneDispose = jest.fn();
const mockPlanePositionCopyFrom = jest.fn();
const mockTextureUpdate = jest.fn();
const mockTextureDispose = jest.fn();
const mockMaterialDispose = jest.fn();
const mockContextClearRect = jest.fn();
const mockContextFillRect = jest.fn();
const mockContextFillText = jest.fn();

const mockPlane = {
  isPickable: true,
  billboardMode: 0,
  position: {
    copyFrom: mockPlanePositionCopyFrom,
  },
  parent: null,
  material: null,
  dispose: mockPlaneDispose,
};

const mockContext = {
  clearRect: mockContextClearRect,
  fillRect: mockContextFillRect,
  fillText: mockContextFillText,
  fillStyle: '',
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
} as unknown as CanvasRenderingContext2D;

jest.mock('@babylonjs/core/Meshes/Builders/planeBuilder', () => ({
  CreatePlane: jest.fn(() => mockPlane),
}));

jest.mock('@babylonjs/core/Meshes/mesh', () => ({
  Mesh: {
    BILLBOARDMODE_ALL: 7,
  },
}));

jest.mock('@babylonjs/core/Materials/Textures/dynamicTexture', () => ({
  DynamicTexture: class {
    public hasAlpha = false;

    public getContext(): CanvasRenderingContext2D {
      return mockContext;
    }

    public update(invertY?: boolean): void {
      mockTextureUpdate(invertY);
    }

    public dispose(): void {
      mockTextureDispose();
    }
  },
}));

jest.mock('@babylonjs/core/Materials/standardMaterial', () => ({
  StandardMaterial: class {
    public diffuseTexture: unknown;
    public opacityTexture: unknown;
    public emissiveColor: unknown;
    public specularColor: unknown;
    public backFaceCulling = true;

    public dispose(): void {
      mockMaterialDispose();
    }
  },
}));

import { createBillboardText } from '@/world3d/scene/createBillboardText';

describe('createBillboardText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlane.isPickable = true;
    mockPlane.billboardMode = 0;
    mockPlane.parent = null;
    mockPlane.material = null;
  });

  it('updates texture with upright Y direction for readable labels', () => {
    const billboard = createBillboardText({} as never, 'agent-label', {
      width: 8,
      height: 3,
      font: 'bold 32px sans-serif',
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    });

    billboard.setText('Builder-01\nIdle');

    expect(mockTextureUpdate).toHaveBeenCalledWith(true);
  });
});
