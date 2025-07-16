<template>
  <div class="scrcpy-container">
    <div class="content-wrapper" ref="fullScreenContainer">
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

      <!-- 浮动坐标窗口 -->
      <FloatingCoordinateWindow
        :visible="isCoordinateTrackingActive && isMouseInScreen"
        :mouse-x="currentMouseX"
        :mouse-y="currentMouseY"
        :absolute-x="currentAbsoluteX"
        :absolute-y="currentAbsoluteY"
        :device-width="getDeviceRealWidth()"
        :device-height="getDeviceRealHeight()"
      />
      <!-- 非全屏模式下的右侧工具栏 -->
      <transition name="sidebar-slide" appear>
        <div class="side-toolbar" v-if="!isLoading && !hasError && !isFullscreen && isSidebarVisible">
        <!-- 侧边栏顶部的收缩按钮 -->
        <div class="sidebar-toggle-top" @click="toggleSidebar">
          <el-tooltip content="收起操作栏" placement="left">
            <el-icon :size="14">
              <ArrowDown />
            </el-icon>
          </el-tooltip>
        </div>
        <DeviceFunctionButton 
          :press-key="pressKey"
          :calc-width-and-height="calcWidthAndHeight"
          :is-fullscreen="isFullscreen"
          @toggle-fullscreen="toggleFullscreen"
          @toggle-visibility="toggleVisibility"
          @toggle-rotate="toggleRotate"
          @toggle-focus="toggleFocus"
          @toggle-notifications="toggleNotifications"
        />
        </div>
      </transition>
      <!-- 全屏模式下的左侧工具栏 -->
      <div class="fullscreen-side-controls" v-if="isFullscreen && !isLoading && !hasError">
        <DeviceFunctionButton 
          :press-key="pressKey"
          :calc-width-and-height="calcWidthAndHeight"
          :is-fullscreen="isFullscreen"
          @toggle-fullscreen="toggleFullscreen"
          @toggle-visibility="toggleVisibility"
          @toggle-rotate="toggleRotate"
          @toggle-focus="toggleFocus"
          @toggle-notifications="toggleNotifications"
        />
      </div>
      <!-- 全屏模式下的底部控制栏 -->
      <div class="fullscreen-bottom-controls" v-if="isFullscreen && !isLoading && !hasError">
        <DeviceOperateButton
          :press-key="pressKey"
          :container-width="300"
          :is-fullscreen="isFullscreen"
          class="mt-1"
        />
      </div>
    </div>
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
    <div class="bottom-control-container" v-if="!isFullscreen">
      <DeviceOperateButton
        :press-key="pressKey"
        :container-width="calcWidthAndHeight[0]"
        :is-fullscreen="isFullscreen"
        class="mt-1"
      />
      <!-- 侧边栏展开按钮 -->
      <div class="sidebar-expand-button" v-if="!isSidebarVisible" @click="toggleSidebar">
        <el-tooltip content="显示操作栏" placement="top">
          <div class="expand-btn">
            <el-icon :size="14">
              <ArrowUp />
            </el-icon>
          </div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, onBeforeUnmount, ref, computed, watch} from 'vue';
import RenderContainer from './components/RenderContainer.vue';
import {useScrcpy} from './ScrcpyLogic.js';
import DeviceOperateButton from "@/pages/scrcpyShow/components/DeviceOperateButton.vue";
import DeviceFunctionButton from "@/pages/scrcpyShow/components/DeviceFunctionButton.vue";
import LoadingScreen from "@/pages/scrcpyShow/components/LoadingScreen.vue";
import FloatingCoordinateWindow from "@/pages/scrcpyShow/components/FloatingCoordinateWindow.vue";
import {
  AndroidKeyCode,
  AndroidMotionEventAction,
  AndroidMotionEventButton,
  ScrcpyPointerId
} from "@yume-chan/scrcpy";
import { ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus';

const renderRef = ref();
const isLoading = ref(true);
const loadingMessage = ref('正在连接设备...');
const loadingSubMessage = ref('请稍等片刻');
const fullScreenContainer = ref(null);
const isFullscreen = ref(false);
// 添加侧边栏显示状态
const isSidebarVisible = ref(false);
// 添加坐标跟踪状态
const isCoordinateTrackingActive = ref(false);
const isMouseInScreen = ref(false); // 鼠标是否在屏幕内
const currentMouseX = ref(0);
const currentMouseY = ref(0);
const currentAbsoluteX = ref(0);
const currentAbsoluteY = ref(0);

// 获取所有必要的变量和函数
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
  handlePointerMove: originalHandlePointerMove,
  handlePointerUp,
  handlePointerLeave: originalHandlePointerLeave,
  handleContextMenu: originalHandleContextMenu,
  handleWheel,
  scrcpyStart,
  destroyClient,
  // 新增状态
  connectionStatus,
  connectionError,
  // 新增变量
  client,
  rotation,
  // 设备分辨率
  deviceRealWidth: getDeviceRealWidth,
  deviceRealHeight: getDeviceRealHeight,
  // 坐标转换函数
  clientPositionToDevicePosition
} = useScrcpy();

// 不再需要这些变量，使用 getDeviceRealWidth() 和 getDeviceRealHeight() 函数

// 自定义鼠标移动处理函数，包装原始函数并添加坐标跟踪功能
const handlePointerMove = async (event) => {
  // 更新鼠标位置
  currentMouseX.value = event.clientX;
  currentMouseY.value = event.clientY;

  // 如果坐标跟踪模式激活，计算设备坐标
  if (isCoordinateTrackingActive.value) {
    // 获取渲染容器的位置和尺寸
    const container = renderRef.value?.renderContainer;
    if (container) {
      const rect = container.getBoundingClientRect();

      // 计算相对于容器的位置
      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;

      // 检查鼠标是否在容器范围内
      const isInBounds = relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height;
      isMouseInScreen.value = isInBounds;

      if (isInBounds) {
        // 计算相对于设备的坐标（0-1范围）
        let pointerViewX = relX / rect.width;
        let pointerViewY = relY / rect.height;

        // 根据旋转调整坐标
        let adjustedX = pointerViewX;
        let adjustedY = pointerViewY;

        // 处理旋转（与 adjustPositionForRotation 保持一致）
        if (rotation === 1) { // 90度
          [adjustedX, adjustedY] = [adjustedY, 1 - adjustedX];
        } else if (rotation === 2) { // 180度
          adjustedX = 1 - adjustedX;
          adjustedY = 1 - adjustedY;
        } else if (rotation === 3) { // 270度
          [adjustedX, adjustedY] = [1 - adjustedY, adjustedX];
        }

        // 计算设备上的绝对坐标 - 使用设备真实分辨率
        const deviceWidth = getDeviceRealWidth();
        const deviceHeight = getDeviceRealHeight();
        currentAbsoluteX.value = Math.round(adjustedX * deviceWidth);
        currentAbsoluteY.value = Math.round(adjustedY * deviceHeight);
      }
    }
  }

  // 调用原始的处理函数
  await originalHandlePointerMove(event);
};

// 自定义鼠标离开处理函数
const handlePointerLeave = async (event) => {
  // 如果坐标跟踪模式激活，隐藏坐标窗口
  if (isCoordinateTrackingActive.value) {
    // 设置鼠标不在屏幕内，这会隐藏坐标窗口
    isMouseInScreen.value = false;
  }

  // 调用原始的处理函数
  await originalHandlePointerLeave(event);
};

// 自定义右键事件处理函数
const handleContextMenu = async (event) => {
  // 如果坐标跟踪模式激活，则复制坐标而不是调用原始处理函数
  if (isCoordinateTrackingActive.value) {
    event.preventDefault();
    event.stopPropagation();

    // 复制相对坐标
    await copyCoordinatesToClipboard();
  } else {
    // 否则调用原始的右键处理函数
    await originalHandleContextMenu(event);
  }
};

// 复制坐标到剪贴板的函数
const copyCoordinatesToClipboard = async () => {
  try {
    const deviceWidth = getDeviceRealWidth();
    const deviceHeight = getDeviceRealHeight();

    // 计算相对坐标
    const relativeX = deviceWidth > 0 ? currentAbsoluteX.value / deviceWidth : 0;
    const relativeY = deviceHeight > 0 ? currentAbsoluteY.value / deviceHeight : 0;

    const relativeCoords = `${relativeX.toFixed(3)}, ${relativeY.toFixed(3)}`;

    await navigator.clipboard.writeText(relativeCoords);

    ElMessage.success({
      message: `✅ 相对坐标已复制到剪贴板: (${relativeCoords})`,
      duration: 3000,
      showClose: true
    });
  } catch (error) {
    console.error('复制到剪贴板失败:', error);

    // 提供备用复制方法
    try {
      const deviceWidth = getDeviceRealWidth();
      const deviceHeight = getDeviceRealHeight();
      const relativeX = deviceWidth > 0 ? currentAbsoluteX.value / deviceWidth : 0;
      const relativeY = deviceHeight > 0 ? currentAbsoluteY.value / deviceHeight : 0;
      const relativeCoords = `${relativeX.toFixed(3)}, ${relativeY.toFixed(3)}`;

      // 尝试使用旧的 execCommand 方法
      const textArea = document.createElement('textarea');
      textArea.value = relativeCoords;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      ElMessage.success({
        message: `✅ 相对坐标已复制到剪贴板: (${relativeCoords})`,
        duration: 3000,
        showClose: true
      });
    } catch (fallbackError) {
      ElMessage.error({
        message: '❌ 复制失败，请手动复制坐标',
        duration: 3000,
        showClose: true
      });
    }
  }
};

const calcWidthAndHeight = computed(() => {
  const [calcWidth, calcHeight] = swapWidthHeight(width.value, height.value)
  return [calcWidth, calcHeight]
})

const pressKey = (event, type) => {
  console.log('Event:', event);  // 原生事件
  console.log('Type:', type, AndroidKeyCode[type]);     // 自定义参数
  handleKeyEvent(event, AndroidKeyCode[type]);
};

// 切换侧边栏显示状态
const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value;
  console.log('切换侧边栏显示状态:', isSidebarVisible.value);
};

// 右侧工具栏功能
const toggleFullscreen = () => {
  console.log('切换全屏模式');
  if (!document.fullscreenElement) {
    fullScreenContainer.value.requestFullscreen().catch((err) => {
      console.error(`无法进入全屏模式: ${err.message}`);
    });
    const canvas = renderRef.value.renderContainer.querySelector('canvas');
    if (canvas) {
      // 设置全屏样式
      canvas.style.height = 'auto';
      canvas.style.width = 'auto';
      canvas.style.maxHeight = '95vh';
      canvas.style.maxWidth = '95vw';
      canvas.style.margin = '0 auto';
      canvas.style.display = 'block';
      canvas.style.borderRadius = '20px';
      canvas.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.5)';
      canvas.style.objectFit = 'contain';
      
      // 延迟计算侧边栏位置，确保canvas已完全渲染
      setTimeout(() => {
        updateSidebarPosition();
      }, 100);
    }
  } else {
    document.exitFullscreen();
  }
  isFullscreen.value = !isFullscreen.value;
};

// 更新侧边栏位置的函数
const updateSidebarPosition = () => {
  const canvas = renderRef.value?.renderContainer?.querySelector('canvas');
  const sidebar = document.querySelector('.fullscreen-side-controls');
  
  if (canvas && sidebar) {
    const canvasRect = canvas.getBoundingClientRect();
    const rightPosition = canvasRect.right + 20; // 屏幕显示区域右侧20px
    
    sidebar.style.left = `${rightPosition}px`;
    sidebar.style.right = 'auto'; // 取消right定位
  }
};

const toggleVisibility = () => {
  console.log('切换可见性');
  // 实现可见性切换功能
  if (renderRef.value && renderRef.value.renderContainer) {
    const container = renderRef.value.renderContainer;
    if (container.style.visibility === 'hidden') {
      container.style.visibility = 'visible';
    } else {
      container.style.visibility = 'hidden';
    }
  }
};

const toggleRotate = () => {
  console.log('旋转屏幕');
  // 实现屏幕旋转功能
  if (client) {
    // 尝试获取渲染器元素
    const renderer = document.querySelector('.video');
    if (renderer) {
      // 通过样式修改实现旋转效果
      const currentTransform = renderer.style.transform || '';
      if (currentTransform.includes('rotate(90deg)')) {
        renderer.style.transform = currentTransform.replace('rotate(90deg)', 'rotate(180deg)');
      } else if (currentTransform.includes('rotate(180deg)')) {
        renderer.style.transform = currentTransform.replace('rotate(180deg)', 'rotate(270deg)');
      } else if (currentTransform.includes('rotate(270deg)')) {
        renderer.style.transform = currentTransform.replace('rotate(270deg)', '');
      } else {
        renderer.style.transform = currentTransform + ' rotate(90deg)';
      }
    }
  }
};

const toggleFocus = () => {
  console.log('切换坐标跟踪模式');
  isCoordinateTrackingActive.value = !isCoordinateTrackingActive.value;

  if (isCoordinateTrackingActive.value) {
    console.log('坐标跟踪模式已启用');
  } else {
    console.log('坐标跟踪模式已禁用');
  }
};

const toggleNotifications = async () => {
  console.log('切换通知');
  // 实现通知切换功能 - 打开/关闭安卓通知栏
  if (client && client.controller) {
    try {
      // 发送下拉通知栏的手势
      await client.controller.injectSwipe({
        pointerId: ScrcpyPointerId.MOUSE,
        action: AndroidMotionEventAction.DOWN,
        buttons: AndroidMotionEventButton.Primary,
        position: { x: deviceRealWidth / 2, y: 10 },
        pressure: 1,
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await client.controller.injectSwipe({
        pointerId: ScrcpyPointerId.MOUSE,
        action: AndroidMotionEventAction.MOVE,
        buttons: AndroidMotionEventButton.Primary,
        position: { x: deviceRealWidth / 2, y: deviceRealHeight / 4 },
        pressure: 1,
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await client.controller.injectSwipe({
        pointerId: ScrcpyPointerId.MOUSE,
        action: AndroidMotionEventAction.UP,
        buttons: AndroidMotionEventButton.Primary,
        position: { x: deviceRealWidth / 2, y: deviceRealHeight / 4 },
        pressure: 0,
      });
    } catch (error) {
      console.error('通知栏操作失败:', error);
    }
  }
};

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


onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// 处理全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  
  // 如果退出全屏，恢复原始样式
  if (!isFullscreen.value) {
    const canvas = renderRef.value?.renderContainer?.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '';
      canvas.style.height = '';
      canvas.style.maxHeight = '';
      canvas.style.margin = '';
      changeStyle(); // 恢复到原始计算的样式
    }
    
    // 重置侧边栏样式
    const sidebar = document.querySelector('.fullscreen-side-controls');
    if (sidebar) {
      sidebar.style.left = '';
      sidebar.style.right = '';
    }
  } else {
    // 进入全屏时也需要更新侧边栏位置
    setTimeout(() => {
      updateSidebarPosition();
    }, 200);
  }
};

onMounted(async () => {
  loadingMessage.value = '正在初始化连接...';
  await scrcpyStart(renderRef.value);
  
  // 添加全屏状态变化监听
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // 添加窗口大小变化监听，用于重新计算侧边栏位置
  window.addEventListener('resize', () => {
    if (isFullscreen.value) {
      setTimeout(() => {
        updateSidebarPosition();
      }, 100);
    }
  });
});

onBeforeUnmount(async () => {
  console.log("销毁 scrcpy");
  try {
    // 移除所有事件监听器
    window.removeEventListener('keydown', handleKeyEvent);
    window.removeEventListener('keyup', handleKeyEvent);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    window.removeEventListener('resize', updateSidebarPosition);
    
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

.content-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-grow: 1;
}

.side-toolbar {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidebar-toggle-top {
  width: 28px;
  height: 28px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #f0f8ff;
    border-color: #1890ff;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
    
    :deep(.el-icon) {
      color: #1890ff !important;
    }
  }
  
  :deep(.el-icon) {
    color: #666;
    transition: color 0.3s ease;
  }
}

.sidebar-expand-button {
  position: absolute;
  right: -10px; /* 移动到容器外部右侧 */
  top: 50%;
  transform: translateY(-50%);
  z-index: 90;
  
  .expand-btn {
    width: 28px;
    height: 28px;
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    
    &:hover {
      background-color: #f0f8ff;
      border-color: #1890ff;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
      
      :deep(.el-icon) {
        color: #1890ff;
      }
    }
    
    :deep(.el-icon) {
      color: #666;
      transition: color 0.3s ease;
    }
  }
}

/* 侧边栏滑动动画 */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.3s ease;
}

.sidebar-slide-enter-from {
  transform: translateY(-50%) translateX(100%);
  opacity: 0;
}

.sidebar-slide-leave-to {
  transform: translateY(-50%) translateX(100%);
  opacity: 0;
}

.sidebar-slide-enter-to,
.sidebar-slide-leave-from {
  transform: translateY(-50%) translateX(0);
  opacity: 1;
}

.bottom-control-container {
  width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  box-sizing: border-box;
  margin-bottom: 10px;
  position: relative;
}

.video {
  border: 3px solid #303133;
  background-color: #303133;
  cursor: url("/src/assets/img/pointer.png") 2 0, crosshair;
  border-radius: 20px;
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

:deep(.video) {
  border-radius: 20px !important;
}

/* 全屏模式下的样式 */
:fullscreen .content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-color: #303133;
}

:fullscreen .video {
  max-height: 95vh;
  max-width: 95vw;
  border-radius: 20px !important;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  margin: -90px auto 0;
}

.fullscreen-bottom-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: 320px;
  background-color: rgba(40, 40, 40, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  padding: 8px 10px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(80, 80, 80, 0.5);
}

/* 全屏模式下底部控制栏的特殊样式 */
:fullscreen .fullscreen-bottom-controls {
  opacity: 0.95;
  transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

:fullscreen .fullscreen-bottom-controls:hover {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
}

.fullscreen-side-controls {
  position: fixed;
  /* right位置将通过JavaScript动态设置 */
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  background-color: rgba(40, 40, 40, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  padding: 10px 5px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(80, 80, 80, 0.5);
}

/* 全屏模式下右侧工具栏的特殊样式 */
:fullscreen .fullscreen-side-controls {
  opacity: 0.95;
  transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

:fullscreen .fullscreen-side-controls:hover {
  opacity: 1;
  transform: translateY(-50%) translateX(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
}
</style>
