import {
  DEFAULT_THEME_ID,
  getAllThemeConfigs,
  getThemeConfigById,
  resolveThemeId,
} from '@/themes/registry'

describe('themes/registry', () => {
  test('returns shark-star config by id', () => {
    const theme = getThemeConfigById('shark-star')

    expect(theme.id).toBe('shark-star')
    expect(theme.themeClass).toBe('theme-shark-star')
  })

  test('falls back to shark-star for unknown id', () => {
    const theme = getThemeConfigById('unknown-theme')

    expect(theme.id).toBe(DEFAULT_THEME_ID)
  })

  test('returns all theme configs', () => {
    const themes = getAllThemeConfigs()
    const ids = themes.map((theme) => theme.id)

    expect(themes).toHaveLength(2)
    expect(ids).toEqual(expect.arrayContaining(['shark-star', 'sakura']))
  })

  test('resolveThemeId returns default for unknown id', () => {
    expect(resolveThemeId('unknown-theme')).toBe(DEFAULT_THEME_ID)
    expect(resolveThemeId('sakura')).toBe('sakura')
  })
})
