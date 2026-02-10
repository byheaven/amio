import { sakuraTheme } from './presets/sakura'
import { sharkStarTheme } from './presets/shark-star'
import type { ThemeConfig, ThemeId } from './types'

export const DEFAULT_THEME_ID: ThemeId = 'shark-star'

const THEME_REGISTRY: Record<ThemeId, ThemeConfig> = {
  'shark-star': sharkStarTheme,
  sakura: sakuraTheme,
}

export function resolveThemeId(id: ThemeId): ThemeId {
  return THEME_REGISTRY[id] ? id : DEFAULT_THEME_ID
}

export function getThemeConfigById(id: ThemeId): ThemeConfig {
  return THEME_REGISTRY[resolveThemeId(id)]
}

export function getAllThemeConfigs(): ThemeConfig[] {
  return Object.values(THEME_REGISTRY)
}
