// Available themes for the theme switcher

export interface ThemeTabBar {
  color: string
  selectedColor: string
  backgroundColor: string
  borderStyle: 'black' | 'white'
}

export interface ThemeOption {
  id: string
  name: string
  icon: string
  colors: [string, string, string] // preview gradient colors
  tabBar: ThemeTabBar
}

export const THEMES: ThemeOption[] = [
  {
    id: 'shark-star',
    name: '鲨之星',
    icon: '🦈',
    colors: ['#0a0a1a', '#1a1a3e', '#4a9eff'],
    tabBar: {
      color: '#999999',
      selectedColor: '#4a9eff',
      backgroundColor: '#1a1a2e',
      borderStyle: 'black',
    },
  },
  {
    id: 'sakura',
    name: '樱花梦',
    icon: '🌸',
    colors: ['#1a0a14', '#2e1530', '#ff6b9d'],
    tabBar: {
      color: '#999999',
      selectedColor: '#ff6b9d',
      backgroundColor: '#1a0a14',
      borderStyle: 'black',
    },
  },
]

export const getThemeById = (id: string): ThemeOption =>
  THEMES.find(t => t.id === id) || THEMES[0]
