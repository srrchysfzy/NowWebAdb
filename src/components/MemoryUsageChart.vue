<template>
  <BaseChart 
    :data="chartData" 
    :y-axis-label-formatter="value => `${value}MB`"
    :colors="['#52c41a']"
    height="170"
    :customPadding="{ left: 40, right: 20, top: 30, bottom: 30 }"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import BaseChart from '../pages/performance/components/BaseChart.vue';

// 定义props
const props = defineProps({
  memoryData: {
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
watch(() => props.memoryData, (newData) => {
  if (newData && newData.length > 0) {
    // 获取最新数据点
    const latestDataPoint = newData[newData.length - 1];
    
    // 添加到历史数据
    historyData.value.push({
      time: new Date(latestDataPoint.timestamp).toLocaleTimeString('zh-CN', { hour12: false }),
      value: latestDataPoint.memory,
      type: '已用内存'
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
        value: 2000 + Math.random() * 1000, // 随机内存占用在2000~3000MB之间
        type: '已用内存'
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