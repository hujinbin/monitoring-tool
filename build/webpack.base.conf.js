'use strict'
const path = require('path')
const utils = require('./utils')
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const ESLintPlugin = require('eslint-webpack-plugin');

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

const createLintingRule = () => ({
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src'), resolve('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  }
})

module.exports = {
  mode: process.env.NODE_ENV,
  context: path.resolve(__dirname, '../'),
  entry: {
    app: process.env.NODE_ENV === 'production' ? './src/index.ts' : './main.ts'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production' ?
      config.build.assetsPublicPath :
      config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json','.ts'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
    }
  },
  module: {
    rules: [
      // ...(config.dev.useEslint ? [createLintingRule()] : []),
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig,
      },
      {
        test: /\.(js|ts)$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test')]
      },
    ]
  },
  plugins: [
    new ESLintPlugin({
      formatter: require('eslint-friendly-formatter'),
      emitWarning: !config.dev.showEslintErrorsInOverlay
    }),
    new VueLoaderPlugin(),
  ],
  optimization: {
    chunkIds: "named",
    moduleIds: "named",
    mangleExports: "deterministic"
  },
  target: ['web', 'es5'],
}
