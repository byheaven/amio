import React from 'react'
import { View } from '@tarojs/components'
import { act, render } from '@tarojs/test-utils-react/dist/pure'

const mockSetTabBarStyle = jest.fn()
const mockTrigger = jest.fn()
const mockOn = jest.fn()
const mockOff = jest.fn()
const mockGetThemePreference = jest.fn()
const mockSetThemePreference = jest.fn()

jest.mock('@tarojs/taro', () => ({
  __esModule: true,
  default: {
    setTabBarStyle: (...args: unknown[]) => mockSetTabBarStyle(...args),
    eventCenter: {
      trigger: (...args: unknown[]) => mockTrigger(...args),
      on: (...args: unknown[]) => mockOn(...args),
      off: (...args: unknown[]) => mockOff(...args),
    },
  },
}))

jest.mock('@/utils/storage', () => ({
  getThemePreference: (...args: unknown[]) => mockGetThemePreference(...args),
  setThemePreference: (...args: unknown[]) => mockSetThemePreference(...args),
}))

import { ThemeProvider, useThemeContext } from '@/themes/ThemeContext'

let latestTheme: ReturnType<typeof useThemeContext> | null = null

const ThemeConsumer: React.FC = () => {
  latestTheme = useThemeContext()
  return <View />
}

describe('themes/ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    latestTheme = null
    mockGetThemePreference.mockReturnValue('sakura')
  })

  test('loads initial theme from storage and applies tab bar style', () => {
    const { unmount } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
      {}
    )

    expect(latestTheme?.id).toBe('sakura')
    expect(mockSetTabBarStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedColor: '#ff6b9d',
      })
    )
    expect(mockOn).toHaveBeenCalledWith('theme:change', expect.any(Function))

    unmount()
  })

  test('switchTheme updates storage and triggers eventCenter', () => {
    mockGetThemePreference.mockReturnValue('shark-star')

    const { unmount } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
      {}
    )

    act(() => {
      latestTheme?.switchTheme('sakura')
    })

    expect(mockSetThemePreference).toHaveBeenCalledWith('sakura')
    expect(mockTrigger).toHaveBeenCalledWith('theme:change', 'sakura')
    expect(mockSetTabBarStyle).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedColor: '#ff6b9d',
      })
    )
    expect(latestTheme?.id).toBe('sakura')

    unmount()
  })

})
