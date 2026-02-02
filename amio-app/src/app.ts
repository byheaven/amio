import { PropsWithChildren, useEffect, useState } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { loadProgress } from './utils/storage'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)

  useLaunch(() => {
    console.log('App launched.')
  })

  useEffect(() => {
    // 获取当前页面信息
    const progress = loadProgress()
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    // Taro H5 使用 hash 路由，需要用 hash 判断
    const hash = window.location.hash
    console.log('App useEffect - path:', currentPath, 'hash:', hash, 'hasSeenIntro:', progress?.hasSeenIntro)

    // 判断是否是根路径访问
    // 根路径: hash 为空、'#'、'#' 或 '#/pages/starlight/index'（Taro H5 默认首页）
    // 子页面: hash 包含 '#/pages/xxx'（但不是 starlight/intro）
    const isRootPath = !hash || hash === '#' || hash === '' || hash === '#/' || hash === '#/pages/starlight/index' || hash === '#/pages/intro/index'
    const isIntro = currentPath.includes('/pages/intro/index')

    if (isRootPath && !isIntro) {
      // 根路径访问：始终显示 intro
      console.log('Root access: redirecting to intro')
      Taro.navigateTo({ url: '/pages/intro/index' })
    }
    // 子页面访问（如 #/pages/home/index）：不处理，直接进应用

    setIsFirstLaunch(!progress?.hasSeenIntro)
  }, [])

  // children 是将要会渲染的页面
  return children
}

export default App
