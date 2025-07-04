<template>
  <BaseChart 
    :data="chartData" 
    :y-axis-label-formatter="value => `${value}MHz`"
    :colors="['#5b8ff9']"
    height="170"
    :customPadding="{ left: 50, right: 20, top: 30, bottom: 30 }"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import BaseChart from '../pages/performance/components/BaseChart.vue';

// 定义props
const props = defineProps({
  cpuData: {
    type: Array,
    default: () => []
  },
  maxPoints: {
    type: Number,
    default: 20 // 默认显示20个数据点
  }
});

// 本地存储历史数据
const historyData = ref([]);

// 添加新的数据点
watch(() => props.cpuData, (newData) => {
  if (newData && newData.length > 0) {
    // 获取最新数据点
    const latestDataPoint = newData[newData.length - 1];
    
    // 添加到历史数据
    historyData.value.push({
      time: new Date(latestDataPoint.timestamp).toLocaleTimeString('zh-CN', { hour12: false }),
      value: latestDataPoint.frequency,
      type: 'CPU频率'
    });
    
    // 保持历史数据不超过最大数量
    if (historyData.value.length > props.maxPoints) {
      historyData.value = historyData.value.slice(-props.maxPoints);
    }
  }
}, { deep: true });

// 模拟初始数据（如果没有真实数据）
onMounted(() => {
  if (historyData.value.length === 0) {
    const now = new Date();
    const mockData = [];
    
    for (let i = 0; i < props.maxPoints; i++) {
      const time = new Date(now.getTime() - (props.maxPoints - i - 1) * 1000);
      mockData.push({
        time: time.toLocaleTimeString('zh-CN', { hour12: false }),
        value: 1200 + Math.random() * 800, // 随机频率在1200~2000MHz之间
        type: 'CPU频率'
      });
    }
    
    historyData.value = mockData;
  }
});

// 图表数据处理
const chartData = computed(() => {
  return historyData.value;
});
</script> 