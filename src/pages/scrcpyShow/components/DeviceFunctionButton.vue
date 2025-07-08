<template>
  <div
      :class="{ 'fullscreen-mode': props.isFullscreen }"
      :style="getContainerStyle()"
      style="border-radius: 10px; width: 50px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <el-space direction="vertical" style="z-index: 999;" class="my-2">
      <div class="icon-container" @click="handleScreenshot">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'截屏'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <Picture />
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleRecord">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'录像'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <VideoCamera/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleFullscreen">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="props.isFullscreen ? '退出全屏' : '进入全屏'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <FullScreen/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleVisibility">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'显示/隐藏'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <View/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleRotate">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'旋转屏幕'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <RefreshRight/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleNotifications">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'通知栏'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <Bell/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleFocus">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'焦点'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <Aim/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleVolumeUp">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'音量+'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <Plus/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handleVolumeDown">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'音量-'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <Minus/>
          </el-icon>
        </el-tooltip>
      </div>
      <div class="icon-container" @click="handlePower">
        <el-tooltip :effect="props.isFullscreen ? 'dark' : 'dark'" :content="'电源'" placement="left">
          <el-icon :size="20" :color="props.isFullscreen ? '#ffffff' : '#303133'">
            <SwitchButton/>
          </el-icon>
        </el-tooltip>
      </div>
    </el-space>
  </div>
</template>

<script setup>
import {
  Minus, 
  Plus, 
  SwitchButton, 
  Camera, 
  VideoCamera, 
  FullScreen, 
  View, 
  RefreshRight, 
  Bell, 
  Aim,
  Picture
} from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus';
import { getAdbInstance } from '@/utils/adbManager.js';

const props = defineProps({
  pressKey: Function,
  calcWidthAndHeight: Array,
  isFullscreen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggleFullscreen', 'toggleVisibility', 'toggleRotate', 'toggleFocus', 'toggleNotifications']);
// 移除未使用的 ref 引入
// (此组件的全屏状态完全由父组件通过 props.isFullscreen 控制)

// 获取容器样式
const getContainerStyle = () => {
  if (props.isFullscreen) {
    return {
      backgroundColor: 'transparent',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      maxHeight: '80vh'
    };
  } else {
    return {
      maxHeight: (props.calcWidthAndHeight[1]-150) + 'px',
      backgroundColor: '#ffffff',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    };
  }
};

// 处理截屏按钮点击
const handleScreenshot = async () => {
  try {
    const adb = getAdbInstance();
    if (!adb) {
      ElMessage.error('ADB 实例未初始化');
      return;
    }
    
    ElMessage.info('正在截取屏幕...');
    
    // 使用 framebuffer API 获取截图
    const screenshot = await adb.framebuffer();
    
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = screenshot.width;
    canvas.height = screenshot.height;
    
    // 获取 canvas 上下文
    const context = canvas.getContext('2d');
    
    // 创建 ImageData 对象
    const imageData = new ImageData(
      new Uint8ClampedArray(screenshot.data),
      screenshot.width,
      screenshot.height
    );
    
    // 将 ImageData 放入 canvas
    context.putImageData(imageData, 0, 0);
    
    // 将 canvas 转换为 PNG 数据 URL
    const url = canvas.toDataURL('image/png');
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    ElMessage.success('截图已保存');
  } catch (error) {
    console.error('截图失败:', error);
    
    if (error.name === 'AdbFrameBufferForbiddenError') {
      ElMessage.error('截图失败: 当前屏幕内容受保护，无法截图');
    } else if (error.name === 'AdbFrameBufferUnsupportedVersionError') {
      ElMessage.error('截图失败: 设备不支持的截图版本');
    } else {
      ElMessage.error(`截图失败: ${error.message || '未知错误'}`);
    }
  }
};

// 处理录像按钮点击
const handleRecord = (e) => {
  if (props.pressKey) {
    props.pressKey(e, 'Record');
  }
};

// 处理全屏按钮点击
const handleFullscreen = () => {
  // 全屏切换逻辑由父组件处理，这里仅向外发送事件
  emit('toggleFullscreen');
};

// 处理可见性按钮点击
const handleVisibility = () => {
  emit('toggleVisibility');
};

// 处理旋转按钮点击
const handleRotate = () => {
  emit('toggleRotate');
};

// 处理焦点按钮点击
const handleFocus = () => {
  emit('toggleFocus');
};

// 处理通知按钮点击
const handleNotifications = () => {
  emit('toggleNotifications');
};

// 处理音量+按钮点击
const handleVolumeUp = () => {
  if (props.pressKey) {
    // 直接发送音量+键码
    props.pressKey(null, 'VolumeUp');
  }
};

// 处理音量-按钮点击
const handleVolumeDown = () => {
  if (props.pressKey) {
    // 直接发送音量-键码
    props.pressKey(null, 'VolumeDown');
  }
};

// 处理电源按钮点击
const handlePower = async () => {
  if (props.pressKey) {
    // 直接发送电源键码，确保按键事件被正确处理
    props.pressKey(null, 'Power');
  }
};
</script>

<style lang="scss" scoped>
.icon-container {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background-color: transparent; /* 默认背景透明 */
  transition: background-color 0.3s; /* 添加过渡效果 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon-container:hover {
  background-color: #f0f0f0; /* 鼠标悬停时的背景颜色 */
  cursor: pointer;
}

/* 确保el-icon内部也居中 */
:deep(.el-icon) {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 全屏模式下的样式 */
.fullscreen-mode {
  background-color: transparent !important;
  box-shadow: none !important;
  width: 70px !important;
}

.fullscreen-mode .icon-container {
  background-color: rgba(60, 60, 60, 0.9);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  margin: 8px 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 100, 100, 0.5);
}

.fullscreen-mode .icon-container:hover {
  background-color: rgba(80, 80, 80, 1);
  transform: scale(1.1);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.fullscreen-mode :deep(.el-icon) {
  color: rgba(255, 255, 255, 0.95);
  font-size: 20px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
</style>