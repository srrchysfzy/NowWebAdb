<template>
  <BaseChart 
    :data="chartData" 
    :y-axis-label-formatter="yAxisFormatter"
    :min="0"
    :max="100"
    :colors="['#52c41a']"
    height="300"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePerformanceStore } from '../../../stores/performance';
import BaseChart from './BaseChart.vue';

// 定义props
const props = defineProps({
  maxPoints: {
    type: Number,
    default: 60 // 默认显示60个数据点
  }
});

const performanceStore = usePerformanceStore();
const chartData = ref([]);

// Y轴标签格式化函数
const yAxisFormatter = (value) => {
  return `${value}%`;
};

// 计算图表数据
const updateChartData = () => {
  const { batteryLevelHistory, timeStamps } = performanceStore;
  
  // 确保有数据
  if (!batteryLevelHistory.length || !timeStamps.length) {
    chartData.value = [];
    return;
  }
  
  // 准备数据
  const data = [];
  
  // 获取最近的N个数据点
  const length = Math.min(props.maxPoints, batteryLevelHistory.length);
  const startIdx = Math.max(0, batteryLevelHistory.length - length);
  
  for (let i = 0; i < length; i++) {
    const idx = startIdx + i;
    
    // 电量数据 - 确保处理null值
    const levelValue = batteryLevelHistory[idx];
    const timeValue = timeStamps[idx];
    
    data.push({
      time: timeValue,
      value: levelValue !== null && levelValue !== undefined ? levelValue : 0,
      type: '电池电量',
      rawValue: levelValue
    });
  }
  
  chartData.value = data;
};

// 监听数据变化
watch(
  () => [
    performanceStore.batteryLevelHistory.length,
    performanceStore.timeStamps.length
  ],
  updateChartData,
  { immediate: true }
);

// 初始化
onMounted(updateChartData);
</script> 