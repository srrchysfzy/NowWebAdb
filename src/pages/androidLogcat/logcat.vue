<template>
  <el-card style="border-radius: 12px" shadow="always">
    <template #header>
      <div class="d-flex justify-content-between">
        <el-space size="large">
          <el-button v-if="!startLogcatFlag" type="primary" plain round :icon="VideoPlay" @click="startLogcat">开始日志</el-button>
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
    <ShowLog :source="logData" :columns="columns" ref="logCatTableRef" @scroll="handleScroll"/>
  </el-card>
</template>
<script setup>
import {Logcat, AndroidLogPriority, LogId} from "@yume-chan/android-bin";
import {WritableStream, AbortController} from "@yume-chan/stream-extra";
import {getAdbInstance} from "@/utils/adbManager.js";
import {VideoPlay, Delete, FolderAdd, SwitchButton} from "@element-plus/icons-vue";
import useWindowResize from "@/utils/useWindowResize.js";
import timestampToFormattedDate from "@/utils/timeUtils.js";
import ShowLog from "@/pages/androidLogcat/showLog.vue";


const {width, height} = useWindowResize()
const startLogcatFlag = ref(false);
const searchText = ref('')
const logData = ref([])
let stopSignal
const columns = computed(() => [
  {
    title: 'Time',
    key: 'second',
    dataKey: 'second',
    minWidth: 170,
  },
  {
    title: 'PID',
    key: 'pid',
    dataKey: 'pid',
    minWidth: 70,
  },
  {
    title: 'TID',
    key: 'tid',
    dataKey: 'tid',
    minWidth: 70,
  },
  {
    title: 'Level',
    key: 'level',
    dataKey: 'level',
    minWidth: 100,
  },
  {
    title: 'LogId',
    key: 'id',
    dataKey: 'id',
    minWidth: 70,
  },
  {
    title: 'Tag',
    key: 'tag',
    dataKey: 'tag',
    width: 300,
  },
  {
    title: 'Message',
    key: 'message',
    dataKey: 'message',
    width: width.value,
  },
])
const testGetColumns = async () => {
  console.log(columns.value)
}
const startLogcat = async () => {
  let adb = await getAdbInstance();
  const logcat = new Logcat(adb);
  const logStream = logcat.binary({dump: true});
  startLogcatFlag.value = true
  stopSignal = new AbortController()
  let key = 0
  let buffer = []

  await logStream.pipeTo(new WritableStream({
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
      logData.value.push(newChunk)

      // if (buffer.length >= 10) { // 每100条数据批量更新
      //   logData.value = [...logData.value, ...buffer]
      //   buffer = []
      // }
    },
  }), { signal: stopSignal.signal })

  // // 处理剩余的数据
  // if (buffer.length > 0) {
  //   logData.value = [...logData.value, ...buffer]
  // }
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
const logCatTableRef = ref();
const isAtBottom = ref(true); // 是否滚动条在底部

// 滚动事件处理，判断是否滚动到底部
const handleScroll = () => {
  // isAtBottom.value = false
};
</script>
<style scoped>

</style>