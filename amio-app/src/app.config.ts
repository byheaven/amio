export default defineAppConfig({
  pages: [
    'pages/intro/index',
    'pages/starlight/index',
    'pages/starocean/index',
    'pages/home/index',
    'pages/game/index'
  ],
  tabBar: {
    list: [
      {
        pagePath: 'pages/starlight/index',
        text: '星光',
      },
      {
        pagePath: 'pages/starocean/index',
        text: '星海',
      },
      {
        pagePath: 'pages/home/index',
        text: '星轨',
      },
    ],
    color: '#666',
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
