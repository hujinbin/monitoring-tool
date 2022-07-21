'use strict'
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const baseWebpackConfig = require('./webpack.base.conf')

const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  stats: "errors-only",
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,
  output: {
    path: config.build.assetsRoot,
    filename: 'monitoring-tool.min.js',
    library: 'monitoring-tool',
    libraryTarget: 'umd'
  },
  watch:true, 
  // 5特有的文件监听
   watchOptions: {
    //默认为空，不监听的⽂件或者⽬录，⽀持正则
    ignored: /node_modules/,
    //监听到⽂件变化后，等300ms再去执⾏，默认300ms,
    aggregateTimeout: 300,
    poll: config.dev.poll,
  },
  // 5新增性能优化
  performance: {
    maxEntrypointSize: 4000000, // 入口起点的最大体积，控制 webpack 何时生成性能提示
    maxAssetSize: 1000000, //单个资源体积(单位: bytes)，控制 webpack 何时生成性能提示
  },
  plugins: [
    // new webpack.DefinePlugin({
    //   'process.env': require('../config/dev.env')
    // }),
    new webpack.HotModuleReplacementPlugin(),
    // new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    // new webpack.NoEmitOnErrorsPlugin(),
    new CleanWebpackPlugin(),
  ],
})

module.exports = devWebpackConfig
