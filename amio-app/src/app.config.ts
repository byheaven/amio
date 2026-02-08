export default defineAppConfig({
  pages: [
    'pages/intro/index',
    'pages/starlight/index',
    'pages/starocean/index',
    'pages/home/index',
    'pages/game/index',
    'pages/world/index'
  ],
  tabBar: {
    list: [
      {
        pagePath: 'pages/starlight/index',
        text: '星光',
        iconPath: './assets/tabbar/starlight.png',
        selectedIconPath: './assets/tabbar/starlight-active.png'
      },
      {
        pagePath: 'pages/starocean/index',
        text: '星海',
        iconPath: './assets/tabbar/starocean.png',
        selectedIconPath: './assets/tabbar/starocean-active.png'
      },
      {
        pagePath: 'pages/home/index',
        text: '星轨',
        iconPath: './assets/tabbar/home.png',
        selectedIconPath: './assets/tabbar/home-active.png'
      },
    ],
    color: '#999',
    selectedColor: '#4a9eff',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: '鲨之星',
    navigationBarTextStyle: 'white',
  }
})
