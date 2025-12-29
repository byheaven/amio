export enum TileType {
  BAMBOO = 'bamboo',
  DOT = 'dot',
  CHARACTER = 'character',
  // Add more as needed for MVP (e.g., icons from PRD: PingPong, Shark, Star)
  PINGPONG = 'pingpong',
  SHARK = 'shark',
  STAR = 'star',
  RACKET = 'racket',
  MEDAL = 'medal',
  HEART = 'heart',
}

export interface TileData {
  id: string; // Unique ID for each tile instance
  type: TileType;
  layer: number; // z-index/stacking layer
  x: number;
  y: number;
  isClickable: boolean;
}

export const MAX_SLOTS = 7;
