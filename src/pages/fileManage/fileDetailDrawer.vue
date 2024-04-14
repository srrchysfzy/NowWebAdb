<template>
  <el-drawer v-model="drawerDisplay">
    <template #header>
      <el-space>
        <el-icon :size="20">
          <Warning/>
        </el-icon>
        <span>详细信息</span>
      </el-space>
    </template>
    <el-text size="large">
      文件名称
      <el-icon style="cursor: pointer;margin-left: 7px">
        <CopyDocument/>
      </el-icon>
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.name }}
    </div>
    <el-text size="large">
      位置
      <el-icon style="cursor: pointer;margin-left: 7px">
        <CopyDocument/>
      </el-icon>
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.path }}
    </div>
    <el-text size="large">
      类型
    </el-text>
    <div class="my-3 fw-bold">
      <span v-if="nowFileInfo.type === 4">文件夹</span>
      <span v-else-if="nowFileInfo.type === 8">文件</span>
      <span v-else-if="nowFileInfo.type === 10">软链接</span>
      <span v-else>未知</span>
    </div>
    <div v-if="nowFileInfo.type === 8">
      <el-text size="large">
        大小
      </el-text>
      <div class="my-3 fw-bold">
        {{ formatSize(nowFileInfo.size) }}
      </div>
    </div>
    <el-text size="large">
      创建时间
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.createTime }}
    </div>
    <el-text size="large">
      修改时间
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.modifyTime }}
    </div>
    <el-text size="large">
      最后访问时间
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.accessTime }}
    </div>
    <el-text size="large">
      所有者
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.uid }}
    </div>
    <el-text size="large">
      用户组
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.gid }}
    </div>
    <el-text size="large">
      权限
    </el-text>
    <div class="my-3 fw-bold">
      {{ nowFileInfo.permissions }}
    </div>
  </el-drawer>
</template>
<script setup>
import {CopyDocument, Warning} from "@element-plus/icons-vue";
import {formatSize} from "@/assets/js/adbManager.js";

const drawerDisplay = ref(false);
const nowFileInfo = ref({
  name: '',
  path: '',
  type: 0,
  size: 0,
  createTime: '',
  modifyTime: '',
  accessTime: '',
  uid: '',
  gid: '',
  permissions: ''
});
defineExpose({
  openDrawer(fileInfo) {
    drawerDisplay.value = true;
    nowFileInfo.value = fileInfo;
  },
  closeDrawer() {
    drawerDisplay.value = false;
  }
})
</script>
<style scoped>
</style>