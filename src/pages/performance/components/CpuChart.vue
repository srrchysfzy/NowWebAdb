<template>
  <BaseChart
    :data="chartData"
    :y-axis-label-formatter="value => `${value}%`"
    :max="100"
    :colors="['#5b8ff9', '#ff6d3b']"
    height="300"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { usePerformanceStore } from '../../../stores/performance';
import BaseChart from './BaseChart.vue';

// 定义props
const props = defineProps({
  maxPoints: {
    type: Number,
    default: 60
  }
});

const performanceStore = usePerformanceStore();
const chartData = ref([]);

const updateChartData = () => {
  const { cpuAppHistory, cpuSystemHistory, timeStamps } = performanceStore;

  if (!cpuAppHistory.length || !timeStamps.length) {
    chartData.value = [];
    return;
  }

  const data = [];
  
  // 获取最近的N个数据点
  const length = Math.min(props.maxPoints, cpuAppHistory.length);
  const startIdx = Math.max(0, cpuAppHistory.length - length);
  
  for (let i = 0; i < length; i++) {
    const idx = startIdx + i;
    const timeValue = timeStamps[idx];
    
    // 应用CPU
    data.push({
      time: timeValue,
      value: cpuAppHistory[idx] !== null && cpuAppHistory[idx] !== undefined ? cpuAppHistory[idx] : 0,
      type: '应用CPU'
    });

    // 系统CPU
    if (idx < cpuSystemHistory.length) {
      data.push({
        time: timeValue,
        value: cpuSystemHistory[idx] !== null && cpuSystemHistory[idx] !== undefined ? cpuSystemHistory[idx] : 0,
        type: '系统CPU'
      });
    }
  }
  chartData.value = data;
};

watch(
  () => performanceStore.timeStamps.length,
  updateChartData
);

onMounted(updateChartData);
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #f56c6c;
  font-size: 14px;
}
</style> 