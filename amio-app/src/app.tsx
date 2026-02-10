import { PropsWithChildren, useEffect } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { loadProgress } from './utils/storage'
import { ThemeProvider } from './themes/ThemeContext'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
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
  }, [])

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}

export default App
