import { useThemeContext } from '../themes/ThemeContext'

/**
 * @deprecated Use useThemeContext() from src/themes/ThemeContext.
 * Kept only for backward compatibility during migration.
 */
export function useTheme() {
  const { id, themeClass, switchTheme } = useThemeContext()
  return {
    themeId: id,
    themeClass,
    switchTheme,
  }
}
