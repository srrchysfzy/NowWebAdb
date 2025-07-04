<template>
  <div class="scrcpy-container">
    <RenderContainer
      ref="renderRef"
      :classes="classes"
      :container-style="containerStyle"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerLeave"
      @contextmenu="handleContextMenu"
      @wheel="handleWheel"
    />
    <LoadingScreen 
      v-if="isLoading"
      :message="loadingMessage"
      :sub-message="loadingSubMessage"
    />
    <div v-if="hasError" class="error-container">
      <div class="error-content">
        <h3>连接错误</h3>
        <p>{{ connectionError }}</p>
        <button @click="retryConnection" class="retry-button">
          重试连接
        </button>
      </div>
    </div>
    <DeviceOperateButton
      :press-key="pressKey"
      class="mt-1"
    />
  </div>
</template>

<script setup>
import {onMounted, onBeforeUnmount, ref, computed} from 'vue';
import RenderContainer from './components/RenderContainer.vue';
import {useScrcpy} from './ScrcpyLogic.js';
import DeviceOperateButton from "@/pages/scrcpyShow/components/DeviceOperateButton.vue";
import LoadingScreen from "@/pages/scrcpyShow/components/LoadingScreen.vue";
import {AndroidKeyCode} from "@yume-chan/scrcpy";

const renderRef = ref();
const isLoading = ref(true);
const loadingMessage = ref('正在连接设备...');
const loadingSubMessage = ref('请稍等片刻');

const calcWidthAndHeight = computed(() => {
  const [calcWidth, calcHeight] = swapWidthHeight(width.value, height.value)
  return [calcWidth, calcHeight]
})

const pressKey = (event, type) => {
  console.log('Event:', event);  // 原生事件
  console.log('Type:', type, AndroidKeyCode[type]);     // 自定义参数
  handleKeyEvent(event, AndroidKeyCode[type]);
};

const {
  width,
  height,
  windowWidth,
  windowHeight,
  openInput,
  containerStyle,
  classes,
  changeStyle,
  openKeyInput,
  swapWidthHeight,
  handleKeyEvent,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handlePointerLeave,
  handleContextMenu,
  handleWheel,
  scrcpyStart,
  destroyClient,
  // 新增状态
  connectionStatus,
  connectionError
} = useScrcpy();

// 计算是否有错误
const hasError = computed(() => connectionStatus.value === 'error');

// 重试连接
const retryConnection = async () => {
  isLoading.value = true;
  loadingMessage.value = '正在重新连接...';
  loadingSubMessage.value = '请稍等片刻';
  
  try {
    await destroyClient();
    setTimeout(async () => {
      await scrcpyStart(renderRef.value);
    }, 1000);
  } catch (error) {
    console.error("重试连接失败:", error);
  }
};

// 监听 width 和 height 的变化
watch([windowWidth, windowHeight], ([newWidth, newHeight]) => {
  console.log("监听到窗口变化了")
  if (width.value !== 0 || height.value !== 0) {
    console.log("渲染完成后才能触发")
    console.log("width or height changed", newWidth, newHeight)
    changeStyle()
  }
});

// 监听屏幕渲染状态
watch([width, height], ([newWidth, newHeight]) => {
  if (newWidth > 0 && newHeight > 0) {
    // 当宽高都有值时，说明屏幕已经渲染出来了
    setTimeout(() => {
      loadingMessage.value = '设备连接成功';
      loadingSubMessage.value = '准备显示屏幕...';
      
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    }, 500);
  }
});

// 监听连接状态
watch(connectionStatus, (newStatus) => {
  console.log('连接状态变化:', newStatus);
  
  switch (newStatus) {
    case 'idle':
      // 初始状态，不做特殊处理
      break;
    case 'connecting':
      isLoading.value = true;
      loadingMessage.value = '正在连接设备...';
      loadingSubMessage.value = '请稍等片刻';
      break;
    case 'connected':
      // 连接成功，屏幕会通过宽高变化监听器隐藏加载界面
      loadingMessage.value = '设备连接成功';
      loadingSubMessage.value = '正在加载屏幕...';
      break;
    case 'error':
      loadingMessage.value = '连接发生错误';
      loadingSubMessage.value = connectionError;
      // 短暂显示错误信息后隐藏加载动画，显示错误界面
      setTimeout(() => {
        isLoading.value = false;
      }, 1500);
      break;
  }
});

onMounted(async () => {
  loadingMessage.value = '正在初始化连接...';
  await scrcpyStart(renderRef.value);
});

onBeforeUnmount(async () => {
  console.log("销毁 scrcpy");
  try {
    // 移除所有事件监听器
    window.removeEventListener('keydown', handleKeyEvent);
    window.removeEventListener('keyup', handleKeyEvent);
    
    // 等待一小段时间，确保所有事件处理完成
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 调用销毁函数
    await destroyClient();
    console.log("scrcpy 资源已清理完成");
  } catch (error) {
    console.error("销毁 scrcpy 资源时出错:", error);
    // 即使出错，也确保设置为 null 以便垃圾回收
    try {
      // 强制清理资源的最后尝试
      if (renderRef.value && renderRef.value.renderContainer) {
        const container = renderRef.value.renderContainer;
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    } catch (e) {
      console.warn("清理渲染容器时出错:", e);
    }
  }
});

// 暴露方法供父组件调用
defineExpose({
  pressKey,
  openKeyInput
});
</script>

<style lang="scss" scoped>
.scrcpy-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video {
  border: 3px solid #303133;
  background-color: #303133;
  cursor: url("/src/assets/img/pointer.png") 2 0, crosshair;
}

.error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(245, 247, 250, 0.9);
  z-index: 90;

  .error-content {
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 80%;

    h3 {
      color: #f56c6c;
      margin-top: 0;
      margin-bottom: 16px;
    }

    p {
      margin-bottom: 20px;
      color: #606266;
    }

    .retry-button {
      background-color: #409eff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #66b1ff;
      }

      &:active {
        background-color: #3a8ee6;
      }
    }
  }
}
</style>
