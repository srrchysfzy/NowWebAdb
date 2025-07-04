<template>
  <div>
    <el-popover
      placement="bottom"
      :width="260"
      trigger="click"
      :popper-class="'wifi-detail-popover'"
      :visible="visible"
      @hide="$emit('update:visible', false)"
    >
      <template #reference>
        <span class="wifi-icon-wrapper" @click="$emit('update:visible', !visible)">
          <slot></slot>
        </span>
      </template>
      <div class="wifi-detail-content">
        <div class="wifi-name">
          <SvgIcon icon="wifiIcon" :color="'#409EFF'" :style="{ width: 18 + 'px', height: 18 + 'px'}" />
          <span>{{ wifiDetails.ssid || '--' }}</span>
        </div>
        <div class="wifi-info-item">
          <div class="wifi-info-label">频率：</div>
          <div class="wifi-info-value">{{ wifiDetails.frequency || '--' }}</div>
        </div>
        <div class="wifi-info-item">
          <div class="wifi-info-label">MAC地址：</div>
          <div class="wifi-info-value">{{ wifiDetails.macAddress || '--' }}</div>
        </div>
        <div class="wifi-info-item">
          <div class="wifi-info-label">IP地址：</div>
          <div class="wifi-info-value">{{ wifiDetails.ipAddress || '--' }}</div>
        </div>
        <div class="wifi-info-item">
          <div class="wifi-info-label">连接速度：</div>
          <div class="wifi-info-value">{{ wifiDetails.linkSpeed || '--' }}</div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import SvgIcon from "@/components/SvgIcon.vue";

defineEmits(['update:visible']);

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  wifiDetails: {
    type: Object,
    default: () => ({
      ssid: '',
      frequency: '',
      macAddress: '',
      ipAddress: '',
      linkSpeed: ''
    })
  }
});
</script>

<style scoped>
.wifi-icon-wrapper {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  height: 100%;
}

:deep(.wifi-detail-popover) {
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.wifi-detail-content {
  padding: 16px;
}

.wifi-name {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
  color: #409EFF;
  gap: 8px;
}

.wifi-info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.wifi-info-label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.wifi-info-value {
  color: #303133;
  flex: 1;
}
</style> 