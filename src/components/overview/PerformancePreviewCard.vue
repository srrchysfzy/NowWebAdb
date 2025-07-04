<template>
  <div class="performance-preview">
    <div class="section-header">
      <SvgIcon icon="CpuIcon" :color="'#E91E63'" :style="{ width: 18 + 'px', height: 18 + 'px'}"/>
      <span class="section-title">性能预览</span>
    </div>
    
    <div class="performance-grid">
      <div class="performance-item">
        <div class="performance-title">CPU 频率</div>
        <div class="performance-value">{{ deviceInfo.cpuCur }}</div>
        <div class="chart-container">
          <CpuFrequencyChart :cpu-data="cpuFrequencyData" />
        </div>
      </div>
      <div class="performance-item">
        <div class="performance-title">内存占用</div>
        <div class="performance-value">{{ Math.round(deviceInfo.memoryUsedRate) }}%</div>
        <div class="chart-container">
          <MemoryUsageChart :memory-data="memoryUsageData" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from "@/components/SvgIcon.vue";
import CpuFrequencyChart from "@/components/CpuFrequencyChart.vue";
import MemoryUsageChart from "@/components/MemoryUsageChart.vue";

defineProps({
  deviceInfo: {
    type: Object,
    required: true
  },
  cpuFrequencyData: {
    type: Array,
    required: true
  },
  memoryUsageData: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.performance-preview {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  height: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  margin-bottom: 20px; /* 增加底部间距 */
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-left: 8px;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.performance-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  padding-bottom: 5px; /* 减少底部内边距 */
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible; /* 允许内容溢出以显示tooltips */
  min-height: 260px; /* 增加高度 */
}

.performance-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 10px 0;
}

.performance-title {
  font-size: 14px;
  color: #909399;
}

.chart-container {
  margin-top: 10px; /* 减少顶部间距 */
  height: 180px; /* 增加高度 */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  overflow: visible; /* 允许内容溢出以显示tooltips */
}
</style> 