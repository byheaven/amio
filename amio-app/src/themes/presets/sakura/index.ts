import type { ThemeConfig } from '../../types'
import { sakuraIcons } from './icons'

export const sakuraTheme: ThemeConfig = {
  id: 'sakura',
  name: '樱花梦',
  icon: '🌸',
  previewColors: ['#1a0a14', '#2e1530', '#ff6b9d'],
  themeClass: 'theme-sakura',
  tabBar: {
    color: '#999999',
    selectedColor: '#ff6b9d',
    backgroundColor: '#1a0a14',
    borderStyle: 'black',
  },
  icons: sakuraIcons,
}
