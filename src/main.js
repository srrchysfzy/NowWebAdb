import { createApp } from 'vue'
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 包含 Popper.js
import App from './App.vue'
import router from './router'
// 创建Pinia实例
const pinia = createPinia();
const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')
