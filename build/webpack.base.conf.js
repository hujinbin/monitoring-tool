'use strict'
const path = require('path')
const config = require('../config')

const ESLintPlugin = require('eslint-webpack-plugin');

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

const createLintingRule = () => ({
  test: /\.(js|ts)$/,
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
    app: './src/index.ts'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production' ?
      config.build.assetsPublicPath :
      config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.json','.ts'],
    alias: {
      '@': resolve('src'),
    }
  },
  module: {
    rules: [
      // ...(config.dev.useEslint ? [createLintingRule()] : []),
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
  ],
  optimization: {
    chunkIds: "named",
    moduleIds: "named",
    mangleExports: "deterministic"
  },
  target: ['web', 'es5'],
}
