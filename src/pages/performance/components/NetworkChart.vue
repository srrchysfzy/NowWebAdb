<template>
  <BaseChart 
    :data="chartData" 
    :y-axis-label-formatter="value => `${value}KB/s`"
    :min="0"
    chart-type="line"
    :colors="['#1890ff', '#13c2c2']"
    :is-stack="false"
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
  const { networkRxHistory, networkTxHistory, timeStamps } = performanceStore;
  
  // 确保有数据
  if (!networkRxHistory.length || !networkTxHistory.length || !timeStamps.length) {
    chartData.value = [];
    return;
  }
  
  // 准备数据
  const data = [];
  const length = Math.min(
    networkRxHistory.length, 
    networkTxHistory.length,
    timeStamps.length,
    props.maxPoints
  );
  
  // 获取最近的N个数据点
  const startIdx = Math.max(0, networkRxHistory.length - length);
  
  for (let i = 0; i < length; i++) {
    const idx = startIdx + i;
    
    // 下载流量 - 确保处理null值
    const rxValue = networkRxHistory[idx];
    data.push({
      time: timeStamps[idx],
      value: rxValue !== null && rxValue !== undefined ? rxValue : 0,
      type: '下载',
      rawValue: rxValue
    });
    
    // 上传流量 - 确保处理null值
    const txValue = networkTxHistory[idx];
    data.push({
      time: timeStamps[idx],
      value: txValue !== null && txValue !== undefined ? txValue : 0,
      type: '上传',
      rawValue: txValue
    });
  }
  
  chartData.value = data;
};

// 监听数据变化
watch(
  () => [
    performanceStore.networkRxHistory.length,
    performanceStore.networkTxHistory.length,
    performanceStore.timeStamps.length
  ],
  updateChartData,
  { immediate: true }
);

// 初始化
onMounted(updateChartData);
</script> 