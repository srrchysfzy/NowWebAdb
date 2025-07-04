<template>
  <div class="info-section">
    <div class="section-header">
      <SvgIcon icon="CpuIcon" :color="'#2196F3'" :style="{ width: 18 + 'px', height: 18 + 'px'}"/>
      <span class="section-title">硬件信息</span>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">CPU 信息</div>
        <div class="info-value">{{ deviceInfo.cpuInfo }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPU 核心数</div>
        <div class="info-value">{{ deviceInfo.cpuCore }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">主板</div>
        <div class="info-value">{{ deviceInfo.board }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">硬件</div>
        <div class="info-value">{{ deviceInfo.hardware }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPU 最小频率</div>
        <div class="info-value">{{ deviceInfo.cpuMin }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPU 最大频率</div>
        <div class="info-value">{{ deviceInfo.cpuMax }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPU 当前频率</div>
        <div class="info-value">{{ deviceInfo.cpuCur }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPU ABI</div>
        <div class="info-value">{{ deviceInfo.cpuAbi }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">支持的 ABIs</div>
        <el-tooltip :content="deviceInfo.abis" placement="top" :disabled="!deviceInfo.abis || deviceInfo.abis.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.abis }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">存储类型</div>
        <el-tooltip :content="deviceInfo.storageType" placement="top" :disabled="!deviceInfo.storageType || deviceInfo.storageType.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.storageType }}</div>
        </el-tooltip>
      </div>
      <div class="info-item">
        <div class="info-label">屏幕分辨率</div>
        <div class="info-value">{{ deviceInfo.resolution }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">屏幕密度</div>
        <div class="info-value">{{ deviceInfo.screenDensity }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">存储空间</div>
        <div class="info-value">{{ deviceInfo.totalStorage }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">内存大小</div>
        <div class="info-value">{{ deviceInfo.totalMemory }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">构建主机</div>
        <el-tooltip :content="deviceInfo.host" placement="top" :disabled="!deviceInfo.host || deviceInfo.host.length < 15">
          <div class="info-value text-ellipsis">{{ deviceInfo.host }}</div>
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