<template>
  <div class="device-control-bar" :style="controlBarStyle" :class="{ 'fullscreen-mode': isFullscreen }">
    <div class="button-container">
      <el-tooltip effect="dark" content="返回" placement="top">
        <el-button @click="handlePress('AndroidBack')">
          <el-icon :size="16"><Back /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="主页" placement="top">
        <el-button @click="handlePress('AndroidHome')">
          <el-icon :size="16"><House /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="多任务" placement="top">
        <el-button @click="handlePress('AndroidAppSwitch')">
          <el-icon :size="16"><CopyDocument /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="菜单" placement="top">
        <el-button @click="handlePress('ContextMenu')">
          <el-icon :size="16"><Menu /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { 
  Menu, CopyDocument, House, Back
} from "@element-plus/icons-vue";
import { computed } from 'vue';

const props = defineProps({
  pressKey: Function,
  containerWidth: {
    type: Number,
    default: 0
  },
  isFullscreen: {
    type: Boolean,
    default: false
  }
});

const controlBarStyle = computed(() => {
  // 如果容器宽度可用，则设置宽度为容器宽度
  if (props.containerWidth && props.containerWidth > 0) {
    return {
      width: `${props.containerWidth}px`,
      maxWidth: '100%'
    };
  }
  return {
    width: '100%',
    maxWidth: '100%'
  };
});

const handlePress = (key) => {
  if (props.pressKey) {
    props.pressKey(null, key);
  }
};
</script>

<style scoped>
.device-control-bar {
  margin-top: 10px;
  padding: 8px 0;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.button-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 50px;
}

.el-button {
  border: none;
  margin: 0;
  padding: 8px;
}

/* 全屏模式下的样式 */
.fullscreen-mode {
  background-color: transparent;
  box-shadow: none;
}

.fullscreen-mode .button-container {
  padding: 0 20px;
  display: flex;
  justify-content: space-around;
}

.fullscreen-mode .el-button {
  background-color: rgba(60, 60, 60, 0.9);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 100, 100, 0.5);
}

.fullscreen-mode .el-button:hover {
  background-color: rgba(80, 80, 80, 1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.fullscreen-mode :deep(.el-icon) {
  color: rgba(255, 255, 255, 0.95);
  font-size: 20px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
</style>
