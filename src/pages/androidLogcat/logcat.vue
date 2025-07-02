<template>
  <div class="logcat-container">
    <show-log />
  </div>
</template>

<script setup>
import ShowLog from './showLog.vue'
</script>

<style scoped>
.logcat-container {
  height: 100%;
  width: 100%;
  padding: 16px;
  background-color: var(--el-bg-color);
}
</style> 