<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-image style="border-radius: 12px;" :style="{ height: height-100 + 'px' }" fit="contain" :src="deviceNowImg" hide-on-click-modal />
    </el-col>
    <el-col :span="16">
<!--      <el-card style="border-radius: 12px">-->
<!--        <el-empty description="暂无数据" />-->
<!--      </el-card>-->
      <el-row :gutter="20">
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="wifiIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}" />
            <span style="font-size: 16px"> Wi-Fi</span>
          </el-space>
          <div class="mt-3">测试WiFi名称</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="EarthIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}" />
            <span style="font-size: 16px"> IP地址</span>
          </el-space>
          <div class="mt-3">测试IP地址</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="AndroidIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}" />
            <span style="font-size: 16px"> 系统版本</span>
          </el-space>
          <div class="mt-3">{{ deviceVersion }}</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="BatteryIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}" />
            <span style="font-size: 16px"> 电池电量</span>
          </el-space>
          <div class="mt-3">测试电池电量</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="StorageIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}" />
            <span style="font-size: 16px"> 存储使用</span>
          </el-space>
          <div class="mt-3">测试存储使用</div>
        </el-col>
        <el-col :span="12" class="mb-4">
          <el-space>
            <SvgIcon icon="MemoryIcon" :color="'#66b1ff'" :style="{ width:18 + 'px', height: 18 + 'px'}" />
            <span style="font-size: 16px"> 内存使用</span>
          </el-space>
          <div class="mt-3">测试内存使用</div>
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
import { useDeviceStore} from "@/stores/device.js";
import { getAdbInstance } from "@/assets/js/adbManager.js";
import useWindowResize from "@/assets/js/useWindowResize.js";
import SvgIcon from "@/components/SvgIcon.vue";

const {width, height} = useWindowResize();
const adbObject = computed(() => {
  return getAdbInstance()
});
const deviceNowImg = ref('')
const deviceVersion = ref('')


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
}
onMounted(() => {
  console.log('mounted')
  getDevice()
})
</script>
<style scoped>

</style>