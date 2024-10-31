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
          <div v-if="deviceIp" class="mt-3">{{ deviceIp }}</div>
          <div v-else class="mt-3">获取中···</div>
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
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="ScreenIcon" :color="'#66b1ff'" :style="{ width:16 + 'px', height: 16 + 'px'}"/>
            <span class="mx-1" style="font-size: 16px">屏幕尺寸</span>
          </el-space>
          <div class="mt-3">{{ deviceScreenSize }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <el-icon :size="18" color="#66b1ff"><Iphone /></el-icon>
            <span style="font-size: 16px"> 序列号</span>
          </el-space>
          <div class="mt-3">{{ deviceSerialno }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="FrameworkIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> 设备Abi</span>
          </el-space>
          <div class="mt-3">{{ deviceAbi }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="CpuIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
            <span style="font-size: 16px"> CPU信息</span>
          </el-space>
          <div class="mt-3">{{ deviceCpuBrand }}<code>{{ deviceCpuCore }}</code> 核</div>
        </el-col>
        
      </el-row>
    </el-col>
  </el-row>
</template>
<script setup>
import {executeCommand, getAdbInstance} from "@/utils/adbManager.js";
import useWindowResize from "@/utils/useWindowResize.js";
import SvgIcon from "@/components/SvgIcon.vue";
import {Iphone} from "@element-plus/icons-vue";

const router = useRouter();
const {width, height} = useWindowResize();
const adbObject = computed(() => {
  return getAdbInstance()
});
const intervalId = ref();
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
const deviceScreenSize = ref('1080*1920')
const deviceSerialno = ref('')
const deviceAbi = ref('')
const deviceCpuCore = ref('')
const deviceCpuBrand = ref('')

const getDevice = async () => {
  try {
    let adb = adbObject.value
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
    deviceNowImg.value = canvas.toDataURL()
    const batteryRes = await batteryVoltage();
    deviceBatteryVoltage.value = batteryRes ? batteryRes.split(':')[1] : '--'
    deviceWifi.value = await wifiInfo()
    deviceIp.value = await getDeviceIp()
    const storageRes = await deviceDiskSpace()
    deviceStorageTotal.value = storageRes.total
    deviceStorageUsed.value = storageRes.used
    deviceStorageUsedRate.value = storageRes.usedRate
    const memoryRes = await deviceMemory()
    deviceMemoryTotal.value = memoryRes.total
    deviceMemoryUsed.value = memoryRes.used.toFixed(2)
    deviceMemoryUsedRate.value = memoryRes.usedRate
    deviceScreenSize.value = await getDeviceScreenSize()
    deviceSerialno.value = await getDeviceSerialno()
    deviceAbi.value = await getDeviceAbi()
    deviceCpuCore.value = await getDeviceCpuCore()
    deviceCpuBrand.value = await getDeviceCpuBrand()
  } catch (e) {
    console.log(e)
    ElNotification.error({
      title: '连接断开',
      message: '连接已断开，请重新连接',
      type: 'error',
      duration: 3000
    })
    // 路由跳转
    await router.push({
      name: "Home",
    });
  }
}
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
const deviceDiskSpace = async () => {
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
const getDeviceScreenSize = async () => {
  const res = await executeCommand('wm size');
  if (res) {
    const sizeRegex = /\b\d{3,4}x\d{3,4}\b/;
    const sizeMatch = res.match(sizeRegex);
    return sizeMatch ? sizeMatch[0] : null
  } else {
    return '';
  }
}
const getDeviceSerialno = async () => {
  const res = await executeCommand('getprop ro.boot.serialno');
  if (res) {
    return res
  } else {
    return '';
  }
}
const getDeviceAbi = async () => {
  const res = await executeCommand('getprop ro.product.cpu.abi');
  if (res) {
    return res
  } else {
    return '';
  }
}
const getDeviceCpuCore = async () => {
  const res = await executeCommand('grep \'^processor\' /proc/cpuinfo | wc -l');
  if (res) {
    return res
  } else {
    return '';
  }
}
const getDeviceCpuBrand = async () => {
  const res = await executeCommand('grep \'^Hardware\' /proc/cpuinfo');
  if (res) {
    return res.split(':')[1]
  } else {
    return '';
  }
}
// 启动一个定时器，每10s执行一次getDevice函数
onMounted(() => {
  console.log('mounted')
  intervalId.value = setInterval(getDevice, 10000);
  getDevice()
})
onUnmounted(() => {
  console.log('unmounted')
  // 清除定时器
  clearInterval(intervalId.value);
})
</script>
<style scoped>

</style>