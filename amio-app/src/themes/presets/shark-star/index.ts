import type { ThemeConfig } from '../../types'
import { sharkStarIcons } from './icons'

export const sharkStarTheme: ThemeConfig = {
  id: 'shark-star',
  name: '鲨之星',
  icon: '🦈',
  previewColors: ['#0a0a1a', '#1a1a3e', '#4a9eff'],
  themeClass: 'theme-shark-star',
  tabBar: {
    color: '#999999',
    selectedColor: '#4a9eff',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
  },
  icons: sharkStarIcons,
}
