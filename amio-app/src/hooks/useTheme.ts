// src/hooks/useTheme.ts
import { useState, useCallback } from 'react'
import { getThemePreference, setThemePreference } from '../utils/storage'

export function useTheme() {
  const [themeId, setThemeId] = useState(() => getThemePreference())

  const themeClass = `theme-${themeId}`

  const switchTheme = useCallback((newThemeId: string) => {
    setThemePreference(newThemeId)
    setThemeId(newThemeId)
  }, [])

  return { themeId, themeClass, switchTheme }
}
