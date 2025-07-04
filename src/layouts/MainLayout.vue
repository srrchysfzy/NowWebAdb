<template>
  <div class="main-layout">
    <!-- 左侧固定的屏幕区域 -->
    <div class="screen-container">
      <DeviceStatusBar />
      <Scrcpy />
    </div>
    <!-- 右侧的内容区域，使用Tabs切换 -->
    <div class="content-wrapper">
      <el-tabs v-model="activeTab" tab-position="left" class="feature-tabs">
        <el-tab-pane label="基础信息" name="overview">
          <Overview />
        </el-tab-pane>
        <el-tab-pane label="文件管理" name="files">
          <FileManage />
        </el-tab-pane>
        <el-tab-pane label="应用管理" name="apps">
          <AppManage />
        </el-tab-pane>
        <el-tab-pane label="日志查看" name="logcat">
          <Logcat />
        </el-tab-pane>
        <el-tab-pane label="命令终端" name="terminal">
          <Terminal />
        </el-tab-pane>
        <el-tab-pane label="性能数据" name="performance">
          <PerformancePage />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Scrcpy from '@/pages/scrcpyShow/scrcpy.vue';
import DeviceStatusBar from '@/components/DeviceStatusBar.vue';
import Overview from '@/pages/overview/overview.vue';
import FileManage from '@/pages/fileManage/fileManage.vue';
import AppManage from '@/pages/appManage/appManage.vue';
import Logcat from '@/pages/androidLogcat/logcat.vue';
import Terminal from '@/pages/terminal/Terminal.vue';
import PerformancePage from '@/pages/performance/PerformancePage.vue';

const activeTab = ref('overview');
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f0f2f5;
}

.screen-container {
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.content-wrapper {
  flex-grow: 1;
  height: 100%;
  overflow: hidden;
  padding: 16px 16px 16px 0;
  box-sizing: border-box;
}

.feature-tabs {
  height: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden; /* Clip children to the rounded border */
}

:deep(.el-tabs__header.is-left) {
  /* Remove the gap and individual card styles */
  margin-right: 0;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  /* Add separator and some padding */
  padding: 8px 0;
  border-right: 1px solid #e4e7ed;
}

:deep(.el-tabs__item.is-left) {
  padding: 0 20px;
  height: 50px;
  line-height: 50px;
  text-align: center;
}

:deep(.el-tabs__content) {
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  overflow-y: auto;
}

:deep(.el-tab-pane) {
  /* The pane itself no longer needs card styling */
  height: auto;
  padding: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}
</style> 