<template>
  <div class="device-status-bar">
    <el-space :size="15" class="status-items">
      <div class="status-item">
        <BatteryIcon :is-charge="isCharge" :quantity="battery" />
      </div>
      <div class="status-item">
        <TemperatureIcon :temperature="temperature" />
      </div>
      <WiFiDetailPopover v-model:visible="wifiPopoverVisible" :wifi-details="wifiDetails">
        <el-space :size="5" style="cursor: pointer;" class="wifi-container status-item">
          <SvgIcon icon="wifiIcon" :color="wifiSsid !== '未连接' && wifiSsid !== '--' ? '#409EFF' : '#606266'" :style="{ width:16 + 'px', height: 16 + 'px'}" />
          <span class="status-text">{{ wifiSsid }}</span>
        </el-space>
      </WiFiDetailPopover>
      <span class="status-text device-model status-item">{{ deviceModel }}</span>
    </el-space>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SvgIcon from "@/components/SvgIcon.vue";
import BatteryIcon from "@/components/BatteryIcon.vue";
import TemperatureIcon from "@/components/TemperatureIcon.vue";
import WiFiDetailPopover from "@/components/WiFiDetailPopover.vue";
import { getAdbInstance, executeCommand } from "@/utils/adbManager.js";
import { getWifiInfo } from "@/utils/deviceInfoService.js";

const battery = ref(0);
const isCharge = ref(false);
const deviceModel = ref('');
const wifiSsid = ref('--');
const temperature = ref(0);
const wifiPopoverVisible = ref(false);
const wifiDetails = ref({
  ssid: '',
  frequency: '',
  macAddress: '',
  ipAddress: '',
  linkSpeed: ''
});

const getDeviceInfo = async () => {
  const adbObject = getAdbInstance();
  if (!adbObject) return;

  // Get battery info
  try {
    const res = await executeCommand('dumpsys battery');
    if (res) {
      const usbPoweredMatch = res.match(/USB powered: (\w+)/);
      const levelMatch = res.match(/level: (\d+)/);
      isCharge.value = usbPoweredMatch ? usbPoweredMatch[1] === 'true' : false;
      battery.value = levelMatch ? Number(levelMatch[1]) : 0;
      
      // Get temperature info
      const tempMatch = res.match(/temperature: (\d+)/);
      if (tempMatch) {
        // Convert temperature from tenths of degrees to degrees
        temperature.value = Math.round(Number(tempMatch[1]) / 10);
      }
    }
  } catch (e) {
    console.warn("Failed to get battery info", e);
  }

  // Get WiFi info using improved method
  try {
    const ssid = await getWifiInfo();
    wifiSsid.value = ssid || '未连接';
    wifiDetails.value.ssid = ssid || '';
    
    // Get detailed WiFi information
    await updateWifiDetails();
  } catch(e) {
    console.warn("Failed to get wifi info", e);
    wifiSsid.value = '--';
  }

  deviceModel.value = adbObject.banner?.model || '';
};

// Get detailed WiFi info for the popover
const updateWifiDetails = async () => {
  try {
    // Get IP address and MAC address from ip addr command
    const ipAddrRes = await executeCommand("ip addr show wlan0");
    if (ipAddrRes) {
      // Extract IP address
      const ipMatch = ipAddrRes.match(/inet\s+([0-9.]+)\/\d+/);
      wifiDetails.value.ipAddress = ipMatch ? ipMatch[1] : '--';
      
      // Extract MAC address
      const macMatch = ipAddrRes.match(/link\/ether\s+([0-9a-f:]+)/i);
      wifiDetails.value.macAddress = macMatch ? macMatch[1] : '--';
    } else {
      wifiDetails.value.ipAddress = '--';
      wifiDetails.value.macAddress = '--';
    }

    // Get detailed WiFi info including frequency and link speed
    const wifiInfoRes = await executeCommand('dumpsys wifi | grep -A 15 "mWifiInfo"');
    if (wifiInfoRes) {
      // Extract frequency
      const frequencyMatch = wifiInfoRes.match(/Frequency: (\d+)MHz/);
      if (frequencyMatch && frequencyMatch[1]) {
        const freqMhz = parseInt(frequencyMatch[1]);
        wifiDetails.value.frequency = freqMhz >= 5000 ? `${freqMhz/1000} GHz` : `${freqMhz} MHz`;
      }

      // Extract link speed
      const linkSpeedMatch = wifiInfoRes.match(/Link speed: (\d+)Mbps/);
      wifiDetails.value.linkSpeed = linkSpeedMatch ? `${linkSpeedMatch[1]} Mbps` : '--';
    }
  } catch (e) {
    console.warn("Failed to get detailed WiFi info", e);
  }
};

let timerId = null;

onMounted(() => {
  getDeviceInfo();
  timerId = setInterval(getDeviceInfo, 5000);
});

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});
</script>

<style scoped>
.device-status-bar {
  background-color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.status-items {
  width: 100%;
  display: flex;
  align-items: center;
}
.status-item {
  display: flex;
  align-items: center;
  height: 24px;
}
.status-text {
    font-size: 13px;
    color: #606266;
    display: inline-flex;
    align-items: center;
}
.device-model {
  font-weight: bold;
}
.wifi-container {
  display: flex;
  align-items: center;
  padding: 3px 0;
}
</style> 