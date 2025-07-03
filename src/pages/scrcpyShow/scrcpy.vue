<template>
  <el-row :gutter="25">
    <el-col :span="12">
      <el-space>
        <div>
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
          <DeviceOperateButton :style="{width: calcWidthAndHeight[0] + 'px'}" :press-key="pressKey" class="mt-1"/>
        </div>
        <el-space direction="vertical" style="z-index: 999;">
          <el-button :type="openInput ? 'primary' : 'info'" :icon="EditPen"
                     @click="openKeyInput(openInput ? 'cancel' : 'open')"/>
          <DeviceFunctionButton :calc-width-and-height="calcWidthAndHeight" :press-key="pressKey"/>
        </el-space>
      </el-space>
    </el-col>
    <el-col :span="12">
    </el-col>
  </el-row>
</template>

<script setup>
import {onMounted, onBeforeUnmount} from 'vue';
import {EditPen} from "@element-plus/icons-vue";
import RenderContainer from './components/RenderContainer.vue';
import {useScrcpy} from './ScrcpyLogic.js';
import DeviceOperateButton from "@/pages/scrcpyShow/components/DeviceOperateButton.vue";
import DeviceFunctionButton from "@/pages/scrcpyShow/components/DeviceFunctionButton.vue";
import {AndroidKeyCode} from "@yume-chan/scrcpy";

const renderRef = ref();
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
  destroyClient
} = useScrcpy();

// 监听 width 和 height 的变化
watch([windowWidth, windowHeight], ([newWidth, newHeight]) => {
  console.log("监听到窗口变化了")
  if (width.value !== 0 || height.value !== 0) {
    console.log("渲染完成后才能触发")
    console.log("width or height changed", newWidth, newHeight)
    changeStyle()
  }

});
onMounted(() => {
  scrcpyStart(renderRef.value);
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
</script>

<style lang="scss" scoped>
.video {
  border: 3px solid #303133;
  background-color: #303133;
  cursor: url("/src/assets/img/pointer.png") 2 0, crosshair;
}
</style>
