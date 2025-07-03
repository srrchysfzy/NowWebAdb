<template>
  <BaseChart
    :data="chartData"
    :y-axis-label-formatter="value => `${value}MB`"
    chart-type="line"
    :is-stack="false"
    :colors="['#1890ff', '#6b48ff', '#52c41a', '#ffc107', '#f44336', '#8543e0']"
    height="300"
  />
</template>

<script setup>
import { computed } from 'vue';
import { usePerformanceStore } from '../../../stores/performance';
import BaseChart from './BaseChart.vue';

// 定义props
const props = defineProps({
  maxPoints: { type: Number, default: 60 }
});

const performanceStore = usePerformanceStore();

const chartData = computed(() => {
  const { memoryTotalHistory, memoryDetailHistory, timeStamps } = performanceStore;
  const data = [];

  if (!timeStamps.length) return [];

  const startIdx = Math.max(0, timeStamps.length - props.maxPoints);

  for (let i = startIdx; i < timeStamps.length; i++) {
    const time = timeStamps[i];

    // 添加总内存数据
    if (memoryTotalHistory[i] !== undefined) {
      data.push({
        time,
        value: memoryTotalHistory[i],
        type: '总内存'
      });
    }

    // 添加详细内存数据
    const detail = memoryDetailHistory[i];
    if (detail) {
      if (detail.javaHeap !== undefined) data.push({ time, value: detail.javaHeap, type: 'Java堆' });
      if (detail.nativeHeap !== undefined) data.push({ time, value: detail.nativeHeap, type: '原生堆' });
      if (detail.code !== undefined) data.push({ time, value: detail.code, type: '代码' });
      if (detail.stack !== undefined) data.push({ time, value: detail.stack, type: '栈' });
      if (detail.graphics !== undefined) data.push({ time, value: detail.graphics, type: '图形' });
    }
  }
  return data;
});
</script> 