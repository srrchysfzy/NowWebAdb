<template>
  <el-card style="border-radius: 12px">
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
            />
            <DeviceOperateButton :style="{width: calcWidthAndHeight[0] + 'px'}" :press-key="pressKey"/>
          </div>
          <el-space direction="vertical" style="z-index: 999;">
            <el-button :type="openInput ? 'primary' : 'info'" :icon="EditPen" @click="openKeyInput(openInput ? 'cancel' : 'open')" />
            <DeviceFunctionButton :calc-width-and-height="calcWidthAndHeight" :press-key="pressKey" />
          </el-space>
        </el-space>
      </el-col>
      <el-col :span="12">
      </el-col>
    </el-row>
  </el-card>
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
  openInput,
  containerStyle,
  classes,
  openKeyInput,
  swapWidthHeight,
  handleKeyEvent,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handlePointerLeave,
  handleContextMenu,
  scrcpyTest,
  destroyClient
} = useScrcpy();

onMounted(() => {
  scrcpyTest(renderRef.value);
});

onBeforeUnmount(() => {
  console.log("销毁 scrcpy");
  destroyClient()
});
</script>

<style lang="scss" scoped>
.video {
  border: 3px solid #303133;
  background-color: #303133;
  cursor: url("/src/assets/img/pointer.png") 2 0, crosshair;
}
</style>
