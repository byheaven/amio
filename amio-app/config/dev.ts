import type { UserConfigExport } from "@tarojs/cli";
export default {
   logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {
    output: {
      filename: 'js/[name].js',
      chunkFilename: 'js/[name].js'
    },
    miniCssExtractPluginOption: {
      ignoreOrder: true,
      filename: 'css/[name].css',
      chunkFilename: 'css/[name].css'
    },
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  }
} satisfies UserConfigExport
