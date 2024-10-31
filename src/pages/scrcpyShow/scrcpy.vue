<template>
  <el-card style="border-radius: 12px">
    <el-space>
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
      <DeviceOperateButton />
    </el-space>
    <el-space style="float: right; margin-top: 3px">
      <el-tooltip effect="dark" content="开启键盘">
        <div style="margin-top: 4px">
          <el-button v-if="openInput" type="primary" circle @click="openKeyInput('cancel')">
            <el-icon :size="12" style="vertical-align: middle">
              <EditPen/>
            </el-icon>
          </el-button>
          <el-button v-else type="info" circle @click="openKeyInput('open')">
            <el-icon :size="12" style="vertical-align: middle">
              <EditPen/>
            </el-icon>
          </el-button>
        </div>
      </el-tooltip>
    </el-space>
  </el-card>
</template>

<script setup>
import {onMounted, onBeforeUnmount} from 'vue';
import {EditPen} from "@element-plus/icons-vue";
import RenderContainer from './components/RenderContainer.vue';
import {useScrcpy} from './ScrcpyLogic.js';
import DeviceOperateButton from "@/pages/scrcpyShow/components/DeviceOperateButton.vue";

const renderRef = ref();
const {
  openInput,
  containerStyle,
  classes,
  openKeyInput,
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
