import { PropsWithChildren, useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import { loadProgress, getThemePreference } from './utils/storage'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)
  const [themeClass] = useState(() => `theme-${getThemePreference()}`)

  useLaunch(() => {
    console.log('App launched.')
  })

  useEffect(() => {
    const progress = loadProgress()
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    const hash = window.location.hash
    console.log('App useEffect - path:', currentPath, 'hash:', hash, 'hasSeenIntro:', progress?.hasSeenIntro)

    const isRootPath = !hash || hash === '#' || hash === '' || hash === '#/' || hash === '#/pages/starlight/index' || hash === '#/pages/intro/index'
    const isIntro = currentPath.includes('/pages/intro/index')

    if (isRootPath && !isIntro) {
      console.log('Root access: redirecting to intro')
      Taro.navigateTo({ url: '/pages/intro/index' })
    }

    setIsFirstLaunch(!progress?.hasSeenIntro)
  }, [])

  return <View className={themeClass}>{children}</View>
}

export default App
