<template>
  <div class="overview-container">
    <!-- 设备基本信息卡片 -->
    <DeviceHeaderCard :device-info="deviceInfo" />

    <!-- 基本信息和电池状态 -->
    <el-row :gutter="20" class="same-height-row">
      <!-- 网络信息 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <NetworkInfoCard :device-info="deviceInfo" />
      </el-col>
      
      <!-- 电池信息 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <BatteryInfoCard :device-info="deviceInfo" />
      </el-col>

      <!-- 存储信息 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <StorageInfoCard :device-info="deviceInfo" />
      </el-col>
    </el-row>
    
    <!-- 性能预览 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <PerformancePreviewCard 
          :device-info="deviceInfo"
          :cpu-frequency-data="cpuFrequencyData"
          :memory-usage-data="memoryUsageData" 
        />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="same-height-row">
      <!-- 系统信息 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <SystemInfoCard :device-info="deviceInfo" />
      </el-col>

      <!-- 硬件信息 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <HardwareInfoCard :device-info="deviceInfo" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElNotification } from 'element-plus';
import { getAdbInstance } from "@/utils/adbManager.js";
import useWindowResize from "@/utils/useWindowResize.js";
import { 
  getDeviceInfo,
  getCpuFrequencyData,
  getMemoryUsageData
} from '@/utils/deviceInfoService';

// 导入拆分的组件
import DeviceHeaderCard from '@/components/overview/DeviceHeaderCard.vue';
import NetworkInfoCard from '@/components/overview/NetworkInfoCard.vue';
import BatteryInfoCard from '@/components/overview/BatteryInfoCard.vue';
import StorageInfoCard from '@/components/overview/StorageInfoCard.vue';
import PerformancePreviewCard from '@/components/overview/PerformancePreviewCard.vue';
import SystemInfoCard from '@/components/overview/SystemInfoCard.vue';
import HardwareInfoCard from '@/components/overview/HardwareInfoCard.vue';

const router = useRouter();
const { width, height } = useWindowResize();

// 设备信息变量
const intervalId = ref();
const performanceIntervalId = ref(); // 用于性能图表数据更新
const deviceInfo = ref({
  // 初始化空对象，将通过getDeviceInfo获取数据
  batteryPercentage: 0,
  voltage: 0,
  temperature: 0,
  memoryUsedRate: 0,
  storageUsedRate: 0,
});

// 性能数据变量
const cpuFrequencyData = ref([]);
const memoryUsageData = ref([]);

/**
 * 获取并更新设备信息
 */
const updateDeviceInfo = async () => {
  try {
    const info = await getDeviceInfo();
    if (info) {
      deviceInfo.value = info;
    } else {
      handleConnectionError();
    }
  } catch (e) {
    console.error('获取设备信息出错:', e);
    handleConnectionError();
  }
};

/**
 * 处理连接错误
 */
const handleConnectionError = () => {
  ElNotification.error({
    title: '连接断开',
    message: '连接已断开，请重新连接',
    type: 'error',
    duration: 3000
  });
  // 路由跳转
  router.push({ name: "Home" });
};

// 每秒更新性能图表数据
const updatePerformanceData = async () => {
  try {
    // 获取CPU频率数据
    const cpuFreqData = await getCpuFrequencyData();
    if (cpuFreqData && cpuFreqData.length > 0) {
      cpuFrequencyData.value = [...cpuFrequencyData.value, ...cpuFreqData];
      // 限制数据点数量
      if (cpuFrequencyData.value.length > 60) {
        cpuFrequencyData.value = cpuFrequencyData.value.slice(-60);
      }
    }

    // 获取内存使用数据
    const memoryData = await getMemoryUsageData();
    if (memoryData && memoryData.length > 0) {
      memoryUsageData.value = [...memoryUsageData.value, ...memoryData];
      // 限制数据点数量
      if (memoryUsageData.value.length > 60) {
        memoryUsageData.value = memoryUsageData.value.slice(-60);
      }
    }
  } catch (e) {
    console.error('更新性能数据失败:', e);
  }
};

onMounted(() => {
  updateDeviceInfo();
  // 每5秒刷新一次设备信息
  intervalId.value = setInterval(updateDeviceInfo, 5000);
  
  // 每3秒更新一次性能图表数据
  performanceIntervalId.value = setInterval(updatePerformanceData, 3000);
  
  // 初始加载性能数据
  updatePerformanceData();
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
  if (performanceIntervalId.value) {
    clearInterval(performanceIntervalId.value);
  }
});
</script>

<style scoped>
.overview-container {
  padding: 10px;
}

/* 确保同一行的卡片高度保持一致 */
.same-height-row {
  display: flex;
  flex-direction: row;
}

.same-height-row > .el-col {
  display: flex;
  flex-direction: column;
}
</style>