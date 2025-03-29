import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
    },
    {
      path: '/application_card',
      name: 'appication_card',
      component: () => import('../views/ApplicationCard.vue'),
    },
    {
      path: '/InterviewQues',
      name: 'InterviewQues',
      component: () => import('../views/InterviewQues.vue'),
    },
  ],
})

export default router
