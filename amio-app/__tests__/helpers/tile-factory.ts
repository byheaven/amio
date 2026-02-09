import { TileType } from '@/constants/game';

export interface TileData {
  id: string;
  type: TileType;
  x: number;
  y: number;
  layer: number;
  isBlocked: boolean;
}

/**
 * Create a TileData object with default values and optional overrides
 */
export function createTile(overrides: Partial<TileData> = {}): TileData {
  return {
    id: '1',
    type: TileType.BAMBOO,
    x: 0,
    y: 0,
    layer: 0,
    isBlocked: false,
    ...overrides,
  };
}

/**
 * Create an array of TileData from tile type names
 * @example createTilesFromTypes(['BAMBOO', 'BAMBOO', 'BAMBOO'])
 */
export function createTilesFromTypes(typeNames: string[]): TileData[] {
  return typeNames.map((typeName, index) => ({
    id: `${index + 1}`,
    type: TileType[typeName as keyof typeof TileType],
    x: index * 2,
    y: 0,
    layer: 0,
    isBlocked: false,
  }));
}

/**
 * Create tiles with specific IDs and types
 */
export function createTilesWithIds(
  configs: Array<{ id: string; type: string }>
): TileData[] {
  return configs.map((config, index) => ({
    id: config.id,
    type: TileType[config.type as keyof typeof TileType],
    x: index * 2,
    y: 0,
    layer: 0,
    isBlocked: false,
  }));
}
