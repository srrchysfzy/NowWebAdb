// src/router/index.js
import HomeView from '@/pages/home/index.vue';
import OverView from '@/pages/overview/index.vue';
import FileManage from "@/pages/fileManage/fileManage.vue";
import AppManage from "@/pages/appManage/appManage.vue";
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
        path: '/fileManage',
        name: 'FileManage',
        component: FileManage,
    },
    {
        path: '/appManage',
        name: 'AppManage',
        component: AppManage,
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
