<template>
  <div class="info-section">
    <div class="section-header">
      <SvgIcon icon="AndroidIcon" :color="'#4CAF50'" :style="{ width: 18 + 'px', height: 18 + 'px'}"/>
      <span class="section-title">系统信息</span>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">设备型号</div>
        <div class="info-value">{{ deviceInfo.deviceModel }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">制造商</div>
        <div class="info-value">{{ deviceInfo.manufacturer }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">品牌</div>
        <div class="info-value">{{ deviceInfo.brand }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">序列号</div>
        <el-tooltip :content="deviceInfo.serialNumber" placement="top" :disabled="!deviceInfo.serialNumber || deviceInfo.serialNumber.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.serialNumber }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">Android 版本</div>
        <div class="info-value">{{ deviceInfo.androidVersion }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">SDK 版本</div>
        <div class="info-value">{{ deviceInfo.sdkVersionCode }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">产品名称</div>
        <div class="info-value">{{ deviceInfo.product }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">构建标识</div>
        <el-tooltip :content="deviceInfo.display" placement="top" :disabled="!deviceInfo.display || deviceInfo.display.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.display }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">构建版本</div>
        <div class="info-value">{{ deviceInfo.id }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">构建类型</div>
        <div class="info-value">{{ deviceInfo.type }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">构建标签</div>
        <el-tooltip :content="deviceInfo.tags" placement="top" :disabled="!deviceInfo.tags || deviceInfo.tags.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.tags }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">引导加载程序</div>
        <div class="info-value">{{ deviceInfo.bootloader }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">分区信息</div>
        <div class="info-value">{{ deviceInfo.abPartition }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">设备 ID</div>
        <div class="info-value">{{ deviceInfo.device }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">内核版本</div>
        <el-tooltip :content="deviceInfo.kernelVersion" placement="top" :disabled="!deviceInfo.kernelVersion || deviceInfo.kernelVersion.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.kernelVersion }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">构建用户</div>
        <div class="info-value">{{ deviceInfo.user }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">构建主机</div>
        <el-tooltip :content="deviceInfo.host" placement="top" :disabled="!deviceInfo.host || deviceInfo.host.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.host }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">指纹</div>
        <el-tooltip :content="deviceInfo.fingerPrint" placement="top" :disabled="!deviceInfo.fingerPrint || deviceInfo.fingerPrint.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.fingerPrint }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">上电时间</div>
        <div class="info-value">{{ deviceInfo.uptime }}</div>
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* 自适应列宽，确保每列最小宽度 */
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

/* 对特别长的文本值应用更强的限制 */
.info-value.text-ellipsis {
  max-width: 180px; /* 限制最大宽度 */
  display: inline-block;
}

/* 为特定元素添加滚动条样式 */
.info-grid::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.info-grid::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 3px;
}

.info-grid::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-radius: 3px;
}
</style> 