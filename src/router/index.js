import Vue from 'vue'
import Router from 'vue-router'
import RulesTest from '@/components/RulesTest'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'RulesTest',
      component: RulesTest
    }
  ]
})
