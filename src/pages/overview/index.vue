<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-image style="border-radius: 12px;" :style="{ height: height-100 + 'px' }" fit="contain" :src="deviceNowImg"
                hide-on-click-modal/>
    </el-col>
    <el-col :span="16">
      <!--      <el-card style="border-radius: 12px">-->
      <!--        <el-empty description="暂无数据" />-->
      <!--      </el-card>-->
      <el-row :gutter="20">
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="wifiIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> Wi-Fi</span>
          </el-space>
          <div class="mt-3">{{ deviceWifi }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="EarthIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> IP地址</span>
          </el-space>
          <div class="mt-3">{{ deviceIp }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="AndroidIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> 系统版本</span>
          </el-space>
          <div class="mt-3">{{ deviceVersion }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="BatteryIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> 电池电压</span>
          </el-space>
          <div class="mt-3">{{ deviceBatteryVoltage }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="StorageIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> 存储使用</span>
          </el-space>
          <div class="mt-3">
            <span>总容量</span>
            <span class="fw-bold mx-2" style="font-size: 13px">{{ deviceStorageTotal }} </span>
            <span>已使用</span>
            <span class="fw-bold mx-2" style="font-size: 13px">{{ deviceStorageUsed }}</span>
            <span class="fw-bold mx-2" style="font-size: 13px">{{ deviceStorageUsedRate }}</span>
          </div>
          <el-progress :percentage="Number(deviceStorageUsedRate.split('%')[0])" class="mt-1" style="width: 280px">
            <span />
          </el-progress>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="MemoryIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> 内存使用</span>
          </el-space>
          <div class="mt-3">
            <span>总内存</span>
            <span class="fw-bold mx-2" style="font-size: 13px">{{ deviceMemoryTotal }}G </span>
            <span>已使用</span>
            <span class="fw-bold mx-2" style="font-size: 13px">{{ deviceMemoryUsed }}G</span>
            <span class="fw-bold mx-2" style="font-size: 13px">{{ deviceMemoryUsedRate }}%</span>
          </div>
          <el-progress :percentage="50" class="mt-1" style="width: 280px">
            <span />
          </el-progress>
        </el-col>
      </el-row>
      <!--      <el-descriptions :column="1" style="margin-top: 20px;border-radius: 12px;" border>-->
      <!--        <el-descriptions-item label="系统版本">Android 11</el-descriptions-item>-->
      <!--        <el-descriptions-item label="分辨率">1080*1920</el-descriptions-item>-->
      <!--        <el-descriptions-item label="内存">4G</el-descriptions-item>-->
      <!--        <el-descriptions-item label="架构">arm64-v8a</el-descriptions-item>-->
      <!--        <el-descriptions-item label="温度">30℃</el-descriptions-item>-->
      <!--      </el-descriptions>-->
    </el-col>
  </el-row>
</template>
<script setup>
import {useDeviceStore} from "@/stores/device.js";
import {getAdbInstance} from "@/assets/js/adbManager.js";
import useWindowResize from "@/assets/js/useWindowResize.js";
import SvgIcon from "@/components/SvgIcon.vue";
import {AdbSubprocessNoneProtocol} from "@yume-chan/adb";
import {DecodeUtf8Stream} from "@yume-chan/stream-extra";

const {width, height} = useWindowResize();
const adbObject = computed(() => {
  return getAdbInstance()
});
const deviceNowImg = ref('')
const deviceVersion = ref('')
const deviceBatteryVoltage = ref('')
const deviceWifi = ref('')
const deviceIp = ref('')
const deviceStorageTotal = ref('112G')
const deviceStorageUsed = ref('50G')
const deviceStorageUsedRate = ref('50%')
const deviceMemoryTotal = ref('4G')
const deviceMemoryUsed = ref('2G')
const deviceMemoryUsedRate = ref('50%')


const getDevice = async () => {
  let adb = adbObject.value
  console.log(adb)
  deviceVersion.value = await adb.getProp("ro.build.version.release");
  const screenshot = await adb.framebuffer();
  const canvas = document.createElement("canvas");
  // 将canvas的样式z-index设置为99999
  canvas.style.zIndex = '99999';
  canvas.width = screenshot.width;
  canvas.height = screenshot.height;
  
  const context = canvas.getContext("2d");
  const imageData = new ImageData(
    new Uint8ClampedArray(screenshot.data),
    screenshot.width,
    screenshot.height,
  );
  context.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL();
  console.log(url)
  deviceNowImg.value = url
  const batteryRes = await batteryVoltage();
  deviceBatteryVoltage.value = batteryRes ? batteryRes.split(':')[1] : '--'
  deviceWifi.value = await wifiInfo()
  deviceIp.value = await getDeviceIp()
  const storageRes = await deviceStore()
  deviceStorageTotal.value = storageRes.total
  deviceStorageUsed.value = storageRes.used
  deviceStorageUsedRate.value = storageRes.usedRate
  const memoryRes = await deviceMemory()
  deviceMemoryTotal.value = memoryRes.total
  deviceMemoryUsed.value = memoryRes.used
  deviceMemoryUsedRate.value = memoryRes.usedRate
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
const batteryVoltage = async () => {
  const res = await executeCommand('dumpsys battery | grep voltage');
  if (res) {
    const voltageRegex = /voltage:\s*(\d+)/gm;
    const voltageMatch = res.match(voltageRegex);
    return voltageMatch ? voltageMatch[1] : null
  } else {
    return '';
  }
};
const deviceStore = async () => {
  const res = await executeCommand('df -h | grep \'/data\'');
  if (res) {
    const storageRegex = /(\d+G) +(\d+G) +\d+G +(\d+%)/;
    const storageMatch = res.match(storageRegex);
    return {
      total: storageMatch ? storageMatch[1] : null,
      used: storageMatch ? storageMatch[2] : null,
      usedRate: storageMatch ? storageMatch[3] : null,
    }
  } else {
    return '';
  }
}
const deviceMemory = async () => {
  const res = await executeCommand('cat /proc/meminfo');
  if (res) {
    const regexMemTotal = /MemTotal:\s+(\d+)\s+kB/;
    const regexMemFree = /MemFree:\s+(\d+)\s+kB/;
    const memTotalMatch = res.match(regexMemTotal);
    const memFreeMatch = res.match(regexMemFree);
    if (memTotalMatch && memFreeMatch) {
      const memTotal = (parseInt(memTotalMatch[1]) / (1024 * 1024)).toFixed(2);
      const memFree = (parseInt(memFreeMatch[1]) / (1024 * 1024)).toFixed(2);
      const memUsed = memTotal - memFree;
      const memUsedRate = ((memUsed / memTotal) * 100).toFixed(2);
      return {
        total: memTotal,
        used: memUsed,
        usedRate: memUsedRate,
      };
    } else {
     return '';
   }
  } else {
    return '';
  }
}

onMounted(() => {
  console.log('mounted')
  getDevice()
})
const wifiInfo = async () => {
  const res = await executeCommand('cmd wifi status');
  if (res) {
    const wifiRegex = /Wifi is connected to "(.*?)"/;
    const wifiMatch = res.match(wifiRegex);
    return wifiMatch ? wifiMatch[1] : null
  } else {
    return '';
  }
}
const getDeviceIp = async () => {
  const res = await executeCommand('ip addr show wlan0');
  if (res) {
    const ipRegex = /inet (\d+\.\d+\.\d+\.\d+)/;
    const ipMatch = res.match(ipRegex);
    return ipMatch ? ipMatch[1] : null
  } else {
    return '';
  }
}
</script>
<style scoped>

</style>