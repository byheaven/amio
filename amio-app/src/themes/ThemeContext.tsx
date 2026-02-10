import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getThemePreference, setThemePreference } from '../utils/storage'
import { getThemeConfigById, resolveThemeId } from './registry'
import type { ThemeIconSet, ThemeId } from './types'
import type { TileType } from '../constants/game'

export const THEME_CHANGE_EVENT = 'theme:change'

interface ResolvedTheme {
  id: ThemeId
  name: string
  themeClass: string
  icons: ThemeIconSet
  switchTheme: (newId: ThemeId) => void
}

const ThemeContext = createContext<ResolvedTheme | null>(null)

function applyTabBarStyle(themeId: ThemeId): void {
  const theme = getThemeConfigById(themeId)
  try {
    Taro.setTabBarStyle({
      color: theme.tabBar.color,
      selectedColor: theme.tabBar.selectedColor,
      backgroundColor: theme.tabBar.backgroundColor,
      borderStyle: theme.tabBar.borderStyle,
    })
  } catch (error) {
    console.error('Failed to set tab bar style:', error)
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeId, setThemeId] = useState<ThemeId>(() => resolveThemeId(getThemePreference()))

  const config = useMemo(() => getThemeConfigById(themeId), [themeId])

  const switchTheme = useCallback((newId: ThemeId) => {
    const resolvedId = resolveThemeId(newId)
    setThemePreference(resolvedId)
    setThemeId(resolvedId)
    applyTabBarStyle(resolvedId)
    Taro.eventCenter.trigger(THEME_CHANGE_EVENT, resolvedId)
  }, [])

  useEffect(() => {
    const handler = (newId: ThemeId) => {
      setThemeId(resolveThemeId(newId))
    }

    Taro.eventCenter.on(THEME_CHANGE_EVENT, handler)
    return () => {
      Taro.eventCenter.off(THEME_CHANGE_EVENT, handler)
    }
  }, [])

  useEffect(() => {
    applyTabBarStyle(themeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolved = useMemo<ResolvedTheme>(() => {
    return {
      id: config.id,
      name: config.name,
      themeClass: config.themeClass,
      icons: config.icons,
      switchTheme,
    }
  }, [config, switchTheme])

  return (
    <ThemeContext.Provider value={resolved}>
      <View className={resolved.themeClass}>{children}</View>
    </ThemeContext.Provider>
  )
}

export function useThemeContext(): ResolvedTheme {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }

  return context
}

export function useTileIcon(type: TileType): string {
  const { icons } = useThemeContext()
  return icons.tiles[type]
}

export function useToolIcons(): ThemeIconSet['tools'] {
  const { icons } = useThemeContext()
  return icons.tools
}
