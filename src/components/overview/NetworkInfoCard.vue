<template>
  <div class="info-section">
    <div class="section-header">
      <SvgIcon icon="wifiIcon" :color="'#FF9800'" :style="{ width: 18 + 'px', height: 18 + 'px'}"/>
      <span class="section-title">网络信息</span>
    </div>
    
    <div class="info-content">
      <div class="info-item">
        <div class="info-label">Wi-Fi</div>
        <div class="info-value">{{ deviceInfo.wifiName }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">IP 地址</div>
        <div class="info-value">{{ deviceInfo.ipAddress }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">无线电版本</div>
        <el-tooltip :content="deviceInfo.radioVersion" placement="top" :disabled="!deviceInfo.radioVersion || deviceInfo.radioVersion.length < 30">
          <div class="info-value text-ellipsis">{{ deviceInfo.radioVersion || '未知' }}</div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from "@/components/SvgIcon.vue";

defineProps({
  deviceInfo: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.info-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  height: calc(100% - 20px); /* 确保同一行中的卡片高度一致 */
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-left: 8px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex-grow: 1;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
  white-space: nowrap; /* 确保标签不会换行 */
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%; /* 确保文本不会超出容器 */
  min-height: 20px; /* 保持高度一致 */
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style> 