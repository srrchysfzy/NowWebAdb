// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/pages/home/index.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  // 更多页面路由...
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
