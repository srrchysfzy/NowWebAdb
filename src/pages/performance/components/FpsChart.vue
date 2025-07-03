<template>
  <BaseChart 
    :data="chartData" 
    :y-axis-label-formatter="value => `${value}fps`"
    :min="0"
    :max="60"
    :colors="['#52c41a', '#faad14']"
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
    default: 60 // 默认显示60个数据点
  }
});

const performanceStore = usePerformanceStore();
const chartData = ref([]);

// 计算图表数据
const updateChartData = () => {
  const { fpsHistory, jankCountHistory, timeStamps } = performanceStore;
  
  // 确保有数据
  if (!fpsHistory.length || !timeStamps.length) {
    chartData.value = [];
    return;
  }
  
  // 准备数据
  const data = [];
  const length = Math.min(
    fpsHistory.length, 
    timeStamps.length,
    props.maxPoints
  );
  
  // 获取最近的N个数据点
  const startIdx = Math.max(0, fpsHistory.length - length);
  
  for (let i = 0; i < length; i++) {
    const idx = startIdx + i;
    
    // FPS数据 - 确保处理null值
    const fpsValue = fpsHistory[idx];
    data.push({
      time: timeStamps[idx],
      value: fpsValue !== null && fpsValue !== undefined ? fpsValue : 0,
      type: 'FPS',
      // 添加原始值用于调试
      rawValue: fpsValue
    });
    
    // 如果有卡顿数据，也添加进去
    if (jankCountHistory.length > idx) {
      // 确保处理null值
      const jankValue = jankCountHistory[idx];
      const processedJankValue = jankValue !== null && jankValue !== undefined 
        ? Math.min(jankValue * 5, 60) // 限制最大值为60
        : 0;
        
      data.push({
        time: timeStamps[idx],
        value: processedJankValue,
        type: '卡顿',
        // 添加原始值用于调试
        rawValue: jankValue
      });
    }
  }
  
  chartData.value = data;
};

// 监听数据变化
watch(
  () => [
    performanceStore.fpsHistory.length,
    performanceStore.jankCountHistory.length,
    performanceStore.timeStamps.length
  ],
  updateChartData,
  { immediate: true }
);

// 初始化
onMounted(updateChartData);
</script> 