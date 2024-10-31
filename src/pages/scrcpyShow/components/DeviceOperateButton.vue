<template>
  <el-button-group class="pressKey">
    <el-tooltip effect="light" content="菜单" placement="bottom">
      <el-button style="width: 25%" type="info" @mousedown="(e) => pressKey(e, 'menu')" @mouseup="(e) => pressKey(e, 'menu')">
        <el-icon :size="13" style="vertical-align: middle">
          <Menu />
        </el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip effect="light" content="任务" placement="bottom">
      <el-button style="width: 25%" type="info" @mousedown="(e) => pressKey(e, 'task')" @mouseup="(e) => pressKey(e, 'task')">
        <el-icon :size="13" style="vertical-align: middle">
          <CopyDocument />
        </el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip effect="light" content="主页" placement="bottom">
      <el-button style="width: 25%" type="info" @mousedown="(e) => pressKey(e, 'home')" @mouseup="(e) => pressKey(e, 'home')">
        <el-icon :size="13" style="vertical-align: middle">
          <House />
        </el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip effect="light" content="返回" placement="bottom">
      <el-button style="width: 25%" type="info" @mousedown="(e) => pressKey(e, 'back')" @mouseup="(e) => pressKey(e, 'back')">
        <el-icon :size="13" style="vertical-align: middle">
          <Back />
        </el-icon>
      </el-button>
    </el-tooltip>
  </el-button-group>
</template>

<script setup>
import {Back, CopyDocument, House, Menu} from "@element-plus/icons-vue";

const pressKey = (event, type) => {
  console.log('Event:', event);  // 原生事件
  console.log('Type:', type);     // 自定义参数
};
</script>

<style scoped lang="scss">
.pressKey {
  padding: 5px;
  width: 100%;
  margin-top: 1px;
  margin-left: 2px;
}
</style>
