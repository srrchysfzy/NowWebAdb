<template>
  <el-space size="large">
    <el-button v-if="!startLogcatFlag" type="primary" plain round :icon="VideoPlay" @click="testLogcat">开始日志</el-button>
    <el-button v-else type="danger" plain round :icon="SwitchButton" @click="stopLogcat">停止日志</el-button>
    <el-button type="warning" plain round :icon="Delete" @click="clearLogcat">清空日志</el-button>
    <el-button type="info" plain round :icon="FolderAdd" @click="saveLogcat">保存日志</el-button>
  </el-space>
  <el-divider />
  <el-table :data="logData" style="width: 100%" :height="height-200">
    <el-table-column prop="second" label="Time" width="170" />
    <el-table-column prop="pid" label="PID" width="70"/>
    <el-table-column prop="tid" label="TID" width="70"/>
    <el-table-column prop="level" label="Level" width="100"/>
    <el-table-column prop="tag" label="Tag" show-overflow-tooltip min-width="130"/>
    <el-table-column prop="message" label="Message" show-overflow-tooltip min-width="300"/>
  </el-table>
</template>
<script setup>
import {Logcat, AndroidLogPriority} from "@yume-chan/android-bin";
import {WritableStream, AbortController} from "@yume-chan/stream-extra";
import {getAdbInstance} from "@/utils/adbManager.js";
import {VideoPlay, Delete, FolderAdd, SwitchButton} from "@element-plus/icons-vue";
import useWindowResize from "@/utils/useWindowResize.js";
import timestampToFormattedDate from "@/utils/timeUtils.js";

const {width, height} = useWindowResize()
const startLogcatFlag = ref(false);
const logData = ref([])
let stopSignal
const testLogcat = async () => {
  let adb = await getAdbInstance();
  const logcat = new Logcat(adb);
  // 启动 logcat
  const logStream = logcat.binary({dump: true});
  startLogcatFlag.value = true
  stopSignal = new AbortController()
  await logStream.pipeTo(new WritableStream({
    write: (chunk) => {
      // 深度拷贝
      let newChunk = JSON.parse(JSON.stringify(chunk))
      newChunk.second = timestampToFormattedDate(newChunk.seconds)
      newChunk.level = AndroidLogPriority[newChunk.priority]
      console.log(newChunk)
      logData.value.push(newChunk)
    },
  }), { signal: stopSignal.signal })
}
const stopLogcat = async () => {
  startLogcatFlag.value = false
  stopSignal.abort()
}
const clearLogcat = async () => {
  logData.value = []
}
const saveLogcat = async () => {
  console.log('save logcat')
}
</script>
<style scoped>

</style>