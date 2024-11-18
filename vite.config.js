import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers';
import {resolve} from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            // @ 替代为 src
            '@': resolve(__dirname, 'src'),
            // @component 替代为 src/component
        },
    },
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
            // 添加 Vue 相关的自动导入配置
            imports: [
                'vue',
                {
                    'vue': [
                        'reactive',
                        'ref',
                        'computed',
                        'watch',
                        'onMounted',
                        'onUnmounted'
                        // 根据需要添加更多 Vue Hook 或 API
                    ],
                },
                'vue-router',
                {'vue-router': ['createRouter', 'createWebHistory', 'useRouter', 'useRoute']},
                'vuex',
            ],
            dts: 'src/auto-imports.d.ts',
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            }
        }
    }
});
