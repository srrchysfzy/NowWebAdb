<template>
  <div class="d-flex justify-content-center homeTitle">
    <h1>设备配对</h1>
  </div>
  <div class="d-flex justify-content-center my-4">
    <h4>选择并验证设备</h4>
  </div>
  <el-card style="border-radius: 12px">
    <div v-if="connectStatus === 'disconnected'" class="d-flex justify-content-center showConnectImg">
      <el-image :src="computerImg" class="computerImgCss" fit="contain"/>
      <SvgIcon :style="{marginTop: 30 + 'px'}" icon="usbIcon"/>
      <div class="horizontalLine" />
      <SvgIcon :style="{marginTop: 30 + 'px'}" icon="typeIcon"/>
      <el-image :src="phoneImg" class="phoneImgCss" fit="contain"/>
    </div>
    <div v-else class="d-flex justify-content-center showConnectImg">
    </div>
    <div class="d-flex justify-content-center">
      <span>使用USB线连接设备</span>
    </div>
    <div class="d-flex justify-content-center my-2">
      <span>然后在弹出窗口中连接</span>
    </div>
    <div class="d-flex justify-content-center my-4">
      <el-button type="primary" @click="connectDevice">连接设备</el-button>
    </div>
  </el-card>

</template>
<script setup>
import computerImg from '@/assets/img/computer.png';
import phoneImg from '@/assets/img/phone.png';
import SvgIcon from '@/components/SvgIcon.vue';
import {AdbDaemonWebUsbDeviceManager} from "@yume-chan/adb-daemon-webusb";

const connectStatus = ref('disconnected');
const connectDevice = async () => {
  const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  const device = await Manager.requestDevice()
  if (device) {
    console.log(device)
  } else {
    ElNotification.error({
      title: '连接失败',
      message: '连接失败，请检查设备是否已连接',
      type: 'error',
      duration: 3000
    })
  }
};
</script>
<style scoped>
.homeTitle {
  margin-top: -100px;
}
.showConnectImg {
  width: 400px;
  height: 150px
}
.computerImgCss {
  height:100px;
  width:100px
}
.horizontalLine {
  background-color: #a8a8a8;
  margin-top:45px;
  margin-right: 4px;
  margin-left: 4px;
  flex-shrink: 0;
  height: 2px;
  width: 40px
}
.phoneImgCss {
  height:80px;
  width:80px;
  margin-top: 10px
}
</style>