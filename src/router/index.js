// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/home/home.vue';
import MainLayout from '@/layouts/MainLayout.vue';

const routes = [
    {
        // 保留Home页面作为连接页面
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: MainLayout,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
