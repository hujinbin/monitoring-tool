// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import monitoringTool from './src/index'

Vue.config.productionTip = false

const monitoring = new monitoringTool()
Vue.use(monitoring)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
