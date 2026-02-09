// src/hooks/useTheme.ts
import { useState, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getThemePreference, setThemePreference } from '../utils/storage'
import { getThemeById } from '../constants/themes'

const THEME_CHANGE_EVENT = 'theme:change'

function applyTabBarStyle(themeId: string): void {
  const theme = getThemeById(themeId)
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

export function useTheme() {
  const [themeId, setThemeId] = useState(() => getThemePreference())

  const themeClass = `theme-${themeId}`

  const switchTheme = useCallback((newThemeId: string) => {
    setThemePreference(newThemeId)
    setThemeId(newThemeId)
    applyTabBarStyle(newThemeId)
    Taro.eventCenter.trigger(THEME_CHANGE_EVENT, newThemeId)
  }, [])

  // Sync theme state across all components using this hook
  useEffect(() => {
    const handler = (newThemeId: string) => {
      setThemeId(newThemeId)
    }
    Taro.eventCenter.on(THEME_CHANGE_EVENT, handler)
    return () => {
      Taro.eventCenter.off(THEME_CHANGE_EVENT, handler)
    }
  }, [])

  // Apply tab bar style on initial mount (for page refreshes with stored theme)
  useEffect(() => {
    applyTabBarStyle(themeId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { themeId, themeClass, switchTheme }
}
