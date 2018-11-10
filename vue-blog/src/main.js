import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import router from './router'
import store from './store'

Vue.config.productionTip = false
Vue.prototype.$imageURL = 'http://localhost:3000/images/'
Vue.prototype.$apiURL = 'http://localhost:3000/api'

Vue.use(ElementUI)

const vm = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

window.vm = vm
