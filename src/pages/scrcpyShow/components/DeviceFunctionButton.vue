<template>
  <div
      :style="{maxHeight: (calcWidthAndHeight[1]-150) + 'px', backgroundColor: '#909399', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}"
      style="border-radius: 10px;width: 50px;text-align: center">
    <el-space direction="vertical" style="z-index: 999;" class="my-2">
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div style="height: 1px;width: 38px;background-color: #E6A23C"></div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div style="height: 1px;width: 38px;background-color: #E6A23C"></div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div class="icon-container" @mousedown="(e) => pressKey(e, 'VolumeUp')" @mouseup="(e) => pressKey(e, 'VolumeUp')">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Plus/>
        </el-icon>
      </div>
      <div class="icon-container" @mousedown="(e) => pressKey(e, 'VolumeDown')" @mouseup="(e) => pressKey(e, 'VolumeDown')">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Minus/>
        </el-icon>
      </div>
      <div style="height: 1px;width: 38px;background-color: #E6A23C"></div>
      <div class="icon-container">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <Edit/>
        </el-icon>
      </div>
      <div class="icon-container" @mousedown="(e) => pressKey(e, 'Power')" @mouseup="(e) => pressKey(e, 'Power')">
        <el-icon :size="20" color="#FFFFFF" style="margin-top: 10px">
          <SwitchButton/>
        </el-icon>
      </div>
    </el-space>
  </div>
</template>

<script setup>
import {Edit, Minus, Plus, SwitchButton} from "@element-plus/icons-vue";

defineProps({
  pressKey: Function,
  calcWidthAndHeight: Array,
})
</script>

<style lang="scss" scoped>
.icon-container {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background-color: transparent; /* 默认背景透明 */
  transition: background-color 0.4s; /* 添加过渡效果 */
}

.icon-container:hover {
  background-color: #a8a8a8; /* 鼠标悬停时的背景颜色 */
  cursor: pointer;
}
</style>