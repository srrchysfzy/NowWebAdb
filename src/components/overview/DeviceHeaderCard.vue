<template>
  <div class="device-header-card">
    <div class="device-image">
      <img :src="'/src/assets/img/phone.png'" alt="Device" />
    </div>
    <div class="device-header-info">
      <h1>{{ deviceInfo.manufacturer }} {{ deviceInfo.deviceModel }}</h1>
      <div class="device-specs">
        <div class="device-spec-item">
          <SvgIcon icon="AndroidIcon" :color="'#4CAF50'" :style="{ width: 16 + 'px', height: 16 + 'px'}"/>
          <span class="mx-2">Android {{ deviceInfo.androidVersion }} (SDK {{ deviceInfo.sdkVersionCode }})</span>
        </div>
        <div class="device-spec-item">
          <SvgIcon icon="CpuIcon" :color="'#2196F3'" :style="{ width: 16 + 'px', height: 16 + 'px'}"/>
          <span class="mx-2">{{ deviceInfo.cpuInfo }} ({{ deviceInfo.cpuCore }})</span>
        </div>
        <div class="device-spec-item">
          <SvgIcon icon="ScreenIcon" :color="'#9C27B0'" :style="{ width: 16 + 'px', height: 16 + 'px'}"/>
          <span class="mx-2">{{ deviceInfo.resolution }} ({{ deviceInfo.screenDensity }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from "@/components/SvgIcon.vue";
import { getBatteryColor, getTemperatureColor } from "@/utils/deviceInfoService.js";

defineProps({
  deviceInfo: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.device-header-card {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.device-image {
  width: 80px;
  height: 80px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-image img {
  max-width: 100%;
  max-height: 100%;
}

.device-header-info {
  flex-grow: 1;
}

.device-header-info h1 {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.device-spec-item {
  display: flex;
  align-items: center;
  background-color: #f0f9ff;
  color: #409EFF;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 13px;
}

.device-status-indicators {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-icon {
  display: flex;
  align-items: center;
  margin-right: 5px;
}

.status-icon span {
  font-size: 14px;
  color: #606266;
}
</style> 