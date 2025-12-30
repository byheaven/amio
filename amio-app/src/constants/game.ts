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

// 宝箱等级
export enum ChestLevel {
  DIAMOND = 'diamond',   // 💎 钻石
  GOLD = 'gold',         // 🥇 黄金
  SILVER = 'silver',     // 🥈 白银
  BRONZE = 'bronze',     // 🥉 青铜
}

// 游戏统计（用于宝箱等级计算）
export interface GameStats {
  attempts: number;      // 当日挑战次数
  toolsUsed: number;     // 本局使用道具数
  undoUsed: boolean;
  shuffleUsed: boolean;
  popUsed: boolean;
}

// 游戏模式
export enum GameMode {
  NORMAL = 'normal',
  HERO = 'hero',
}
