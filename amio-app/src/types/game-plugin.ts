import React from 'react';
import {
  GameAction,
  GameConfig,
  GameState,
  EngineGameStatus,
  PerformanceMetrics,
  GameTool,
  HeroConfig,
  RatingConfig,
} from '@/engine/types';

export interface GameMeta {
  id: string;
  narrativeName: string;
  narrativeDesc: string;
  icon: string;
  thumbnailComponent: React.ComponentType;
  energyReward: number;
}

export interface GameComponentProps<TState extends GameState> {
  state: TState;
  onAction: (action: GameAction) => void;
  onUseTool: (toolId: string) => void;
  mode: 'normal' | 'hero';
}

export interface GamePlugin<TState extends GameState = GameState> {
  id: string;
  meta: GameMeta;
  ratingConfig: RatingConfig;
  initGame: (config: GameConfig) => TState;
  handleAction: (state: TState, action: GameAction) => TState;
  getStatus: (state: TState) => EngineGameStatus;
  getPerformance: (state: TState) => PerformanceMetrics;
  getTools: () => GameTool[];
  useTool: (state: TState, toolId: string) => TState;
  getHeroConfig: () => HeroConfig;
  GameComponent: React.ComponentType<GameComponentProps<TState>>;
}
