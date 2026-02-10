import { TileType } from '../constants/game'

export type ThemeId = string

export interface ThemeTabBar {
  color: string
  selectedColor: string
  backgroundColor: string
  borderStyle: 'black' | 'white'
}

export interface ThemeIconSet {
  tiles: Record<TileType, string>
  tools: {
    undo: string
    pop: string
    shuffle: string
  }
}

export interface ThemeConfig {
  id: ThemeId
  name: string
  icon: string
  previewColors: [string, string, string]
  themeClass: string
  tabBar: ThemeTabBar
  icons: ThemeIconSet

  layoutVariant?: 'compact' | 'default' | 'spacious'
  animations?: Record<string, string>
  colors?: Record<string, string>
}
