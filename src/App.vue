<template>
  <el-container>
    <el-header v-if="showHeader">
      <HeaderMenu />
    </el-header>
    <el-main>
      <router-view/>
    </el-main>
  </el-container>
</template>
<script setup>
import HeaderMenu from "@/layouts/headerMenu.vue";
import useWindowResize from "@/utils/useWindowResize.js";
import router from "@/router/index.js";

const {width, height} = useWindowResize();
// 根据当前的路由判断是否显示头部
const showHeader = computed(() => {
  return router.currentRoute.value.name !== 'Home';
})
</script>
<style scoped>

</style>
