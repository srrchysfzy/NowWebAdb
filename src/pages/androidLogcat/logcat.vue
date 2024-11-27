<template>
  <el-card style="border-radius: 12px" shadow="always">
    <template #header>
      <div class="d-flex justify-content-between">
        <el-space size="large">
          <el-button v-if="!startLogcatFlag" type="primary" plain round :icon="VideoPlay" @click="startLogcat">
            开始日志
          </el-button>
          <el-button v-else type="danger" plain round :icon="SwitchButton" @click="stopLogcat">停止日志</el-button>
          <el-button type="warning" plain round :icon="Delete" @click="clearLogcat">清空日志</el-button>
          <el-button type="info" plain round :icon="FolderAdd" @click="saveLogcat">保存日志</el-button>
          <el-button type="info" plain round @click="testGetColumns">查看行</el-button>
        </el-space>
        <div>
          <el-input v-model="searchText" placeholder="搜索日志" clearable style="width: 200px"></el-input>
        </div>
      </div>
    </template>
    <el-row :gutter="10" style="width: 99%">
      <el-col :span="4">
        <span>时间</span>
      </el-col>
      <el-col :span="2">
        <span>进程ID</span>
      </el-col>
      <el-col :span="2">
        <span>线程ID</span>
      </el-col>
      <el-col :span="2">
        <span>日志等级</span>
      </el-col>
      <el-col :span="4">
        <span>标签</span>
      </el-col>
      <el-col :span="10">
        <span>日志内容</span>
      </el-col>
    </el-row>
    <ShowLog :source="logData" ref="logCatTableRef"/>
  </el-card>
</template>
<script setup>
import {AndroidLogPriority, Logcat, LogId} from "@yume-chan/android-bin";
import {AbortController, WritableStream} from "@yume-chan/stream-extra";
import {getAdbInstance} from "@/utils/adbManager.js";
import {Delete, FolderAdd, SwitchButton, VideoPlay} from "@element-plus/icons-vue";
import timestampToFormattedDate from "@/utils/timeUtils.js";
import ShowLog from "@/pages/androidLogcat/showLog.vue";

const logCatTableRef = ref()
const startLogcatFlag = ref(false);
const searchText = ref('')
const logData = ref([])
const stopSignal = ref();
const buffer = ref([]);
const flushRequested = ref(false);
const stream = ref();
const testGetColumns = async () => {
  console.log(logData.value)
}

const startLogcat = () => {
  let adb = getAdbInstance();
  const logcat = new Logcat(adb);
  if (startLogcatFlag.value) {
    return;
  }

  logData.value = [];
  startLogcatFlag.value = true;
  stream.value = logcat.binary();
  stopSignal.value = new AbortController();
  let key = 0
  stream.value
      .pipeTo(
          new WritableStream({
            write: (chunk) => {
              key++
              let newChunk = {
                second: timestampToFormattedDate(chunk.seconds),
                pid: chunk.pid,
                tid: chunk.tid,
                level: AndroidLogPriority[chunk.priority],
                tag: chunk.tag,
                message: chunk.message,
                logId: LogId[chunk.logId],
                id: key
              }
              buffer.value.push(newChunk);
              if (!flushRequested.value) {
                flushRequested.value = true;
                requestAnimationFrame(flush);
              }
            },
          }),
          {signal: stopSignal.value.signal}
      )
      .catch((e) => {
        if (stopSignal.value.abort) {
          return;
        }

        throw e;
      });
    // 延迟2秒后开始滚动到底部
  setTimeout(() => {
    watch(() => logData.value, () => {
      logCatTableRef.value.scrollToBottom();
    }, { deep: true });
  }, 5000);
};
const flush = () => {
  logData.value.push(...buffer.value);
  buffer.value = [];
  flushRequested.value = false;
};
const stopLogcat = async () => {
  startLogcatFlag.value = false
  stopSignal.value.abort();
}
const clearLogcat = async () => {
  logData.value = []
}
const saveLogcat = async () => {
  console.log('saveLogcat')
}
</script>
<style scoped>

</style>