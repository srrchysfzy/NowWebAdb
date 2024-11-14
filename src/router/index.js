// src/router/index.js
import HomeView from '@/pages/home/home.vue';
import OverView from '@/pages/overview/overview.vue';
import FileManage from "@/pages/fileManage/fileManage.vue";
import AppManage from "@/pages/appManage/appManage.vue";
import androidLogcat from "@/pages/androidLogcat/logcat.vue"
import Terminal from '@/pages/terminal/Terminal.vue';
import screenControl from '@/pages/scrcpyShow/scrcpy.vue';

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
        path: '/logcat',
        name: 'androidLogcat',
        component: androidLogcat,
    },
    {
        path: '/terminal',
        name: 'Terminal',
        component: Terminal,
    },
    {
        path: '/screenControl',
        name: 'screenControl',
        component: screenControl,
    },

];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
