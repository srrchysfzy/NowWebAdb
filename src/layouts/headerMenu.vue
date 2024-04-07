<template>
  <el-menu
    :default-active="activeIndex"
    mode="horizontal"
    class="menuCss"
    :ellipsis="false"
    @select="handleSelect"
    router
  >
    <SvgIcon icon="HomeIcon" style="margin-top: 15px" :style="{width:35 + 'px', height:35 + 'px'}"></SvgIcon>
    <el-menu-item index="overview">
      <span class="fw-bold fs-6">概览</span>
    </el-menu-item>
    <el-menu-item index="1">
      <span class="fw-bold fs-6">文件管理器</span>
    </el-menu-item>
    <el-menu-item index="2">
      <span class="fw-bold fs-6">应用管理器</span>
    </el-menu-item>
    <el-menu-item index="3">
      <span class="fw-bold fs-6">实时日志</span>
    </el-menu-item>
    <el-menu-item index="terminal">
      <span class="fw-bold fs-6">终端操作</span>
    </el-menu-item>
    <el-menu-item index="5">
      <span class="fw-bold fs-6">屏幕操作</span>
    </el-menu-item>
    <div class="flex-grow"/>
    <el-space class="mx-2" style="font-size: 14px;">
      <TemperatureIcon style="margin-right: 10px" :temperature="temperature"/>
      <BatteryIcon class="mx-2" :is-charge="isCharge" :quantity="battery"/>
      <SvgIcon icon="wifiIcon" :color="'#409EFF'" style="margin-right: 10px;cursor: pointer"
               :style="{ width:18 + 'px', height: 18 + 'px'}"/>
      <span class="fw-bold" style="margin-top: -3px;font-size: 15px">{{ adbObject?.banner.model }}</span>
      <el-icon>
        <Switch/>
      </el-icon>
    </el-space>
  </el-menu>
</template>
<script setup>
import useWindowResize from "@/assets/js/useWindowResize.js";
import SvgIcon from "@/components/SvgIcon.vue";
import BatteryIcon from "@/components/BatteryIcon.vue";
import TemperatureIcon from "@/components/TemperatureIcon.vue";
import {Switch} from "@element-plus/icons-vue";
// import {useDeviceStore} from "@/stores/device.js";
import {getAdbInstance} from "@/assets/js/adbManager.js";
import {DecodeUtf8Stream} from "@yume-chan/stream-extra";
import {AdbSubprocessNoneProtocol} from "@yume-chan/adb";

// const deviceStore = useDeviceStore();
const {width, height} = useWindowResize();
const activeIndex = ref('overview')
let timerId = null;
const temperature = ref(0);
const battery = ref(0);
const isCharge = ref(false);
const adbObject = computed(() => {
  return getAdbInstance()
});

const deviceBatteryInfo = async () => {
  const res = await executeCommand('dumpsys battery');
  if (res) {
    const usbPoweredRegex = /USB powered: (\w+)/;
    const levelRegex = /level: (\d+)/;
    const temperatureRegex = /temperature: (\d+)/;
    const voltageRegex = /voltage: (\d+)/;
    
    const usbPoweredMatch = res.match(usbPoweredRegex);
    const levelMatch = res.match(levelRegex);
    const temperatureMatch = res.match(temperatureRegex);
    const voltageMatch = res.match(voltageRegex);
    
    const usbPowered = usbPoweredMatch ? usbPoweredMatch[1] : null;
    const level = levelMatch ? levelMatch[1] : null;
    const temperature = temperatureMatch ? temperatureMatch[1] : null;
    const voltage = voltageMatch ? voltageMatch[1] : null;
    return {
      usbPowered,
      level,
      temperature,
      voltage,
    }
  } else {
    return {};
  }
};

const getBatteryInfo = async () => {
  if (adbObject.value) {
    const res = await deviceBatteryInfo();
    temperature.value = Number(res.temperature) / 10
    isCharge.value = res.usbPowered === 'true'
    battery.value = Number(res.level)
  }
}
const executeCommand = async (command) => {
  if (!adbObject.value) {
    return;
  }
  try {
    const process = await adbObject.value.subprocess.spawn(command, {
      protocols: [AdbSubprocessNoneProtocol],
    });
    let chunks
    const decodeStream = new DecodeUtf8Stream();
    
    await process.stdout.pipeThrough(decodeStream).pipeTo(
      new WritableStream({
        write(chunk) {
          chunks = chunk
        },
      })
    );
    await process.kill();
    return chunks;
  } catch (error) {
    console.error('执行命令出错:', error);
    return ''
  }
};

const handleSelect = () => {
  console.log('select')
}
onMounted(() => {
  getBatteryInfo()
  // 每隔5秒执行一次
  timerId = setInterval(getBatteryInfo, 5000);
})
// 在组件销毁之前清理定时器
onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});
</script>
<style scoped>
.flex-grow {
  flex-grow: 1;
}

.menuCss:deep(.el-menu-item:hover), .menuCss:deep(.el-menu-item.is-active) {
  background-color: #ffffff !important;
  color: var(--el-color-primary) !important;
}
</style>