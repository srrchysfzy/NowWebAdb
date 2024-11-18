import { createApp } from 'vue'
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 包含 Popper.js
import App from './App.vue'
import router from './router'
import "vue-virtual-scroller/dist/vue-virtual-scroller.css" // 引入它的 css
import VirtualScroller from "vue-virtual-scroller" // 引入它
// 创建Pinia实例
const pinia = createPinia();
const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(VirtualScroller)
app.mount('#app')
