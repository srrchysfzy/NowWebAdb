<template>
  <div class="chart-container" ref="chartContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, markRaw, nextTick } from 'vue';
import { Chart } from '@antv/g2';

// 定义props
const props = defineProps({
  // 图表高度
  height: {
    type: [String, Number],
    default: '300'
  },
  // 图表宽度
  width: {
    type: [String, Number],
    default: '100%'
  },
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // X轴字段
  xField: {
    type: String,
    default: 'time'
  },
  // Y轴字段
  yField: {
    type: String,
    default: 'value'
  },
  // 分组字段
  seriesField: {
    type: String,
    default: 'type'
  },
  // Y轴最小值
  min: {
    type: Number,
    default: 0
  },
  // Y轴最大值
  max: {
    type: Number,
    default: null
  },
  // Y轴标签格式化函数
  yAxisLabelFormatter: {
    type: Function,
    default: text => text
  },
  // 图表类型：line, area, column, bar
  chartType: {
    type: String,
    default: 'line'
  },
  // 是否平滑曲线
  smooth: {
    type: Boolean,
    default: true
  },
  // 是否显示数据点
  showPoints: {
    type: Boolean,
    default: true
  },
  // 颜色配置
  colors: {
    type: Array,
    default: () => ['#1890ff', '#2fc25b', '#facc14', '#f04864', '#8543e0']
  },
  // 是否堆叠
  isStack: {
    type: Boolean,
    default: false
  },
  // 自定义内边距
  customPadding: {
    type: Object,
    default: () => ({ left: 40, right: 20, top: 30, bottom: 50 })
  }
});

// 引用和状态
const chartContainer = ref(null);
const chart = ref(null);

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) {
    console.warn('图表容器不存在，无法初始化图表');
    return;
  }
  
  try {
    // 销毁旧的图表实例（如果存在）
    if (chart.value) {
      chart.value.destroy();
      chart.value = null;
    }
    
    // 创建图表实例并用 markRaw 包装
    const newChart = new Chart({
      container: chartContainer.value,
      autoFit: true,
      height: typeof props.height === 'number' ? props.height : parseInt(props.height, 10) || 300,
      paddingLeft: props.customPadding.left,
      paddingRight: props.customPadding.right,
      paddingTop: props.customPadding.top,
      paddingBottom: props.customPadding.bottom,
    });
    
    // 构建图表配置
    const options = {
      type: props.chartType,
      data: props.data,
      encode: {
        x: props.xField,
        y: props.yField,
        color: props.seriesField
      },
      scale: {
        [props.xField]: {
          type: 'time',
          mask: 'HH:mm:ss'
        },
        [props.yField]: {
          nice: true,
          min: props.min,
          max: props.max,
          labelFormatter: props.yAxisLabelFormatter
        },
        color: { range: props.colors }
      },
      axis: {
        x: {
          title: null,
          labelAutoRotate: true,
          labelAutoHide: true
        },
        y: {
          labelFormatter: props.yAxisLabelFormatter
        }
      },
      legend: {
        position: 'top',
        itemMarker: 'square'
      },
      interaction: {
        tooltip: {
          shared: true,
          item: (item, i, data) => {
            const value = item.value === null || typeof item.value === 'undefined'
              ? '暂无数据'
              : props.yAxisLabelFormatter(item.value);
            return { ...item, value };
          },
          domStyles: {
            'g2-tooltip': {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '4px',
              padding: '8px 12px',
              zIndex: 100
            }
          }
        }
      },
      style: {
        ...(props.isStack && { stack: true }),
        ...(props.smooth && (props.chartType === 'line' || props.chartType === 'area') && { shape: 'smooth' }),
        ...(props.showPoints && (props.chartType === 'line') && {
          point: {
            size: 4,
            shape: 'circle',
            style: {
              stroke: '#fff',
              lineWidth: 1
            }
          }
        })
      }
    };
    
    // 应用配置
    newChart.options(options);
    
    // 渲染图表
    newChart.render().catch(error => {
      console.error('渲染图表时出错:', error);
    });
    
    chart.value = markRaw(newChart);
  } catch (error) {
    console.error('初始化图表时出错:', error);
  }
};

// 更新图表数据
const updateChartData = () => {
  if (!chart.value) {
    console.warn('图表实例不存在，无法更新数据');
    // 尝试重新初始化图表
    nextTick(initChart);
    return;
  }
  
  try {
    // 更新数据
    chart.value.changeData(props.data);
    chart.value.render().catch(error => {
      console.error('渲染更新后的图表时出错:', error);
    });
  } catch (error) {
    console.error('更新图表数据时出错:', error);
  }
};

// 监听数据变化
watch(
  () => props.data,
  (newData) => {
    if (newData && newData.length > 0) {
      if (chart.value) {
        updateChartData();
      } else {
        nextTick(initChart);
      }
    }
  },
  { deep: true, immediate: true }
);

// 监听配置变化
watch(
  () => [
    props.chartType,
    props.smooth,
    props.showPoints,
    props.isStack,
    props.min,
    props.max,
    props.colors,
    props.height,
    props.customPadding
  ],
  () => {
    // 配置变化时，需要重新创建图表
    nextTick(initChart);
  },
  { deep: true }
);

// 生命周期钩子
onMounted(() => {
  try {
    // 确保容器已渲染
    if (props.data && props.data.length > 0) {
      initChart();
    }
    
    // 窗口大小变化时重新调整图表大小
    const handleResize = () => {
      if (chart.value) {
        try {
          chart.value.resize();
        } catch (error) {
          console.error('调整图表大小时出错:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // 返回清理函数
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });
  } catch (error) {
    console.error('初始化图表时出错:', error);
  }
});

onUnmounted(() => {
  // 销毁图表实例，避免内存泄漏
  if (chart.value) {
    try {
      chart.value.destroy();
      chart.value = null;
    } catch (error) {
      console.error('销毁图表时出错:', error);
    }
  }
});

// 暴露方法
defineExpose({
  getChart: () => chart.value,
  updateData: (newData) => {
    if (chart.value && newData && newData.length > 0) {
      try {
        chart.value.changeData(newData);
        chart.value.render().catch(error => {
          console.error('渲染更新后的图表时出错:', error);
        });
      } catch (error) {
        console.error('更新图表数据时出错:', error);
      }
    }
  },
  resize: () => {
    if (chart.value) {
      try {
        chart.value.resize();
      } catch (error) {
        console.error('调整图表大小时出错:', error);
      }
    }
  }
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style> 