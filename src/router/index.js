// src/router/index.js
import HomeView from '@/pages/home/index.vue';
import OverView from '@/pages/overview/index.vue';
import Terminal from '@/pages/terminal/Terminal.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
    },
    {
        path: '/overview',
        name: 'Overview',
        component: OverView,
    },
    {
        path: '/terminal',
        name: 'Terminal',
        component: Terminal,
    },

];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
