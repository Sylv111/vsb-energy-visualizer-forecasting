const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      '/api/sse': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq) => {
          proxyReq.setHeader('Connection', 'keep-alive');
          proxyReq.setHeader('Cache-Control', 'no-cache');
        },
        onProxyRes: (proxyRes) => {
          proxyRes.headers['Connection'] = 'keep-alive';
          proxyRes.headers['Cache-Control'] = 'no-cache';
          proxyRes.headers['Content-Type'] = 'text/event-stream';
        }
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
      })
    ]
  }
}) 