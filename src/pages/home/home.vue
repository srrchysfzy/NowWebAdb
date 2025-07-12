<template>
  <div v-if="connectStatus === 'disconnected'">
    <div class="d-flex justify-content-center homeTitle">
      <h1>设备配对</h1>
    </div>
    <div class="d-flex justify-content-center my-4">
      <h4>选择并验证设备</h4>
    </div>
  </div>
  <div v-else-if="connectStatus === 'autoConnecting'">
    <div class="d-flex justify-content-center homeTitle">
      <h2 class="mb-5">正在自动连接
        <span class="fw-bold" style="font-size: 25px;color: #409EFF">{{ devicesName }}</span>
      </h2>
    </div>
    <div class="d-flex justify-content-center my-4">
      <span class="fw-bold">正在自动连接设备，请稍候…</span>
    </div>
  </div>
  <div v-else-if="connectStatus === 'connectConfirming'">
    <div class="d-flex justify-content-center homeTitle">
      <h2 class="mb-5">正在连接
        <span class="fw-bold" style="font-size: 25px;color: #409EFF">{{ devicesName }}</span>
      </h2>
    </div>
    <div class="d-flex justify-content-center my-4">
      <span class="fw-bold">请在手机的允许调试弹窗中勾选一律允许复选框，并点击允许按钮</span>
    </div>
  </div>
  <div v-else>
    <div class="d-flex justify-content-center homeTitle">
      <h2 class="mb-5">正在连接
        <span class="fw-bold" style="font-size: 25px;color: #409EFF">{{ devicesName }}</span>
      </h2>
    </div>
    <div class="d-flex justify-content-center my-4">
      <span class="fw-bold">正在连接设备，请稍候…</span>
    </div>
  </div>
  <div class="d-flex justify-content-center">
    <el-card style="border-radius: 12px;">
      <div v-if="connectStatus === 'disconnected'" class="d-flex justify-content-center showConnectImg">
        <el-image :src="computerImg" class="computerImgCss" fit="contain"/>
        <SvgIcon :style="{marginTop: 30 + 'px'}" icon="usbIcon"/>
        <div class="horizontalLine"/>
        <SvgIcon :style="{marginTop: 30 + 'px'}" icon="typeIcon"/>
        <el-image :src="phoneImg" class="phoneImgCss" fit="contain"/>
      </div>
      <div v-else class="d-flex justify-content-center showConnectImg">
        <el-image :src="computerImg" class="computerImgCss" fit="contain"/>
        <div class="connectingCss">
          <!-- 使用循环生成元素 -->
          <div v-for="index in 3" :key="index" class="connecting-dot"></div>
        </div>
        <el-image :src="phoneImg" class="phoneImgCss" fit="contain"/>
      </div>
      <div v-if="connectStatus === 'disconnected'">
        <div class="d-flex justify-content-center">
          <span>使用USB线连接设备</span>
        </div>
        <div class="d-flex justify-content-center my-2">
          <span>然后在弹出窗口中连接</span>
        </div>
        <div class="d-flex justify-content-center my-4">
          <el-button type="primary" @click="connectDevice">连接设备</el-button>
        </div>
        <div class="d-flex justify-content-center my-2" v-if="!hasStoredDevices">
          <el-alert 
            title="自动连接提示" 
            type="info" 
            show-icon
            :closable="false"
            style="max-width: 400px;">
            <template #default>
              首次连接成功后，下次访问将自动连接已授权的设备
            </template>
          </el-alert>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 多设备选择弹窗 -->
  <el-dialog
    v-model="showDeviceSelector"
    title="选择连接设备"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div style="margin-bottom: 20px;">
      <span style="color: #666;">检测到多个已授权设备，请选择要连接的设备：</span>
    </div>
    <div v-for="device in availableDevices" :key="device.index" style="margin-bottom: 10px;">
      <el-card
        :class="['device-card', { 'selected': selectedDevice?.index === device.index }]"
        @click="selectedDevice = device"
        style="cursor: pointer;"
      >
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px;">{{ device.name }}</div>
            <div style="color: #666; font-size: 12px;">
              VID: {{ device.vendorId }} / PID: {{ device.productId }}
            </div>
          </div>
          <el-icon v-if="selectedDevice?.index === device.index" color="#409EFF" size="20">
            <Check />
          </el-icon>
        </div>
      </el-card>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelDeviceSelection">取消</el-button>
        <el-button type="primary" @click="connectSelectedDevice" :disabled="!selectedDevice">
          连接设备
        </el-button>
      </span>
    </template>
  </el-dialog>

</template>
<script setup>
import { Check } from '@element-plus/icons-vue';
import computerImg from '@/assets/img/computer.png';
import phoneImg from '@/assets/img/phone.png';
import SvgIcon from '@/components/SvgIcon.vue';
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import {setAdbInstance} from "@/utils/adbManager.js";
import { deviceCredentialManager } from "@/utils/deviceCredentialManager.js";

const router = useRouter();

const connectStatus = ref('disconnected');
const devicesName = ref('')
let timerId;  // 定时器标识

// 检查是否有存储的设备
const hasStoredDevices = ref(false);

// 多设备选择相关状态
const showDeviceSelector = ref(false);
const availableDevices = ref([]); // [{ name, vendorId, productId, index }]
const selectedDevice = ref(null);
let rawDevices = [];

// 检查是否有存储的凭证
const checkStoredCredentials = async () => {
  try {
    if (!AdbDaemonWebUsbDeviceManager.BROWSER) {
      hasStoredDevices.value = false;
      return;
    }
    
    const devices = await AdbDaemonWebUsbDeviceManager.BROWSER.getDevices();
    if (!devices || devices.length === 0) {
      hasStoredDevices.value = false;
      return;
    }
    
    // 检查是否有存储的RSA密钥
    const credentialStore = new AdbWebCredentialStore();
    let hasKeys = false;
    
    try {
      // 尝试迭代存储的密钥
      for await (const key of credentialStore.iterateKeys()) {
        hasKeys = true;
        break; // 只要有一个密钥就足够了
      }
    } catch (error) {
      console.log('检查存储密钥时出错:', error);
    }
    
    // 如果有已授权的设备且有存储的密钥，则可以尝试自动连接
    hasStoredDevices.value = devices.length > 0 && hasKeys;
    
  } catch (error) {
    console.error('检查存储凭证时出错:', error);
    hasStoredDevices.value = false;
  }
};

// 连接指定设备
const connectToDevice = async (device, credentialStore) => {
  try {
    const connection = await device.connect();
    
    // 使用存储的凭证进行认证
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection: connection,
      credentialStore: credentialStore,
    });
    
    const adb = new Adb(transport);
    setAdbInstance(adb);
    
    connectStatus.value = 'connected';
    
    // 短暂延迟后跳转到仪表板
    setTimeout(async () => {
      await router.push({
        path: "/dashboard",
      });
    }, 1000);
    
    return true;
    
  } catch (error) {
    // 检查是否是密钥过期或认证失败
    if (error.message && (
      error.message.includes('auth') || 
      error.message.includes('unauthorized') ||
      error.message.includes('permission') ||
      error.message.includes('key')
    )) {
      throw new Error('CREDENTIAL_EXPIRED');
    }
    throw error;
  }
};

// 尝试自动连接已授权的设备
const tryAutoConnect = async () => {
  try {
    connectStatus.value = 'autoConnecting';
    devicesName.value = '检查已授权设备...';
    
    // 检查是否有WebUSB支持
    if (!AdbDaemonWebUsbDeviceManager.BROWSER) {
      connectStatus.value = 'disconnected';
      devicesName.value = '';
      return false;
    }

    // 获取所有已授权的设备
    const devices = await AdbDaemonWebUsbDeviceManager.BROWSER.getDevices();
    rawDevices = devices;
    
    if (!devices || devices.length === 0) {
      connectStatus.value = 'disconnected';
      devicesName.value = '';
      return false;
    }

    const credentialStore = new AdbWebCredentialStore();
    
    // 检查是否有存储的RSA密钥
    let hasKeys = false;
    try {
      for await (const key of credentialStore.iterateKeys()) {
        hasKeys = true;
        break;
      }
    } catch (error) {
      console.log('检查存储密钥时出错:', error);
    }
    
    if (!hasKeys) {
      connectStatus.value = 'disconnected';
      devicesName.value = '';
      return false;
    }
    
    // 如果有多个设备，显示选择弹窗
    if (devices.length > 1) {
      availableDevices.value = devices.map((d, idx) => ({
        name: d.productName || d.name || '未知设备',
        vendorId: d.vendorId,
        productId: d.productId,
        index: idx
      }));
      selectedDevice.value = availableDevices.value[0];
      showDeviceSelector.value = true;
      connectStatus.value = 'disconnected';
      devicesName.value = '';
      return false; // 等待用户选择
    }
    
    // 只有一个设备，直接连接
    const device = devices[0];
    devicesName.value = device.productName || device.name || '未知设备';
    
    setTimeout(() => {
      changeColor();
    }, 100);

    try {
      await connectToDevice(device, credentialStore);
      return true;
    } catch (error) {
      if (error.message === 'CREDENTIAL_EXPIRED') {
        // 密钥过期，清除凭证并返回连接界面
        await clearExpiredCredentials();
        ElNotification.warning({
          title: '认证已过期',
          message: '设备认证已过期，请重新连接设备',
          type: 'warning',
          duration: 3000
        });
      }
      
      connectStatus.value = 'disconnected';
      devicesName.value = '';
      return false;
    }
    
  } catch (error) {
    console.error('自动连接过程中出错:', error);
    connectStatus.value = 'disconnected';
    devicesName.value = '';
    return false;
  }
};

// 连接选中的设备
const connectSelectedDevice = async () => {
  if (!selectedDevice.value) return;
  
  showDeviceSelector.value = false;
  connectStatus.value = 'autoConnecting';
  devicesName.value = selectedDevice.value.name;
  
  setTimeout(() => {
    changeColor();
  }, 100);
  
  try {
    const credentialStore = new AdbWebCredentialStore();
    // 用 index 找到原始 device
    const device = rawDevices[selectedDevice.value.index];
    await connectToDevice(device, credentialStore);
  } catch (error) {
    if (error.message === 'CREDENTIAL_EXPIRED') {
      // 密钥过期，清除凭证并返回连接界面
      await clearExpiredCredentials();
      ElNotification.warning({
        title: '认证已过期',
        message: '设备认证已过期，请重新连接设备',
        type: 'warning',
        duration: 3000
      });
    } else {
      ElNotification.error({
        title: '连接失败',
        message: '连接设备时出错，请重试',
        type: 'error',
        duration: 3000
      });
    }
    
    connectStatus.value = 'disconnected';
    devicesName.value = '';
  }
};

// 取消设备选择
const cancelDeviceSelection = () => {
  showDeviceSelector.value = false;
  availableDevices.value = [];
  selectedDevice.value = null;
};

// 清除过期的凭证
const clearExpiredCredentials = async () => {
  try {
    await deviceCredentialManager.clearAllCredentials();
    hasStoredDevices.value = false;
  } catch (error) {
    console.error('清除过期凭证时出错:', error);
  }
};

// 手动连接设备
const connectDevice = async () => {
  connectStatus.value = 'connecting'
  setTimeout(() => {
    changeColor()
  }, 100)

  connectStatus.value = 'connectConfirming'
  const device = await AdbDaemonWebUsbDeviceManager.BROWSER?.requestDevice()
  connectStatus.value = 'connected'
  if (device) {
    devicesName.value = device.name

    try {
      const credentialStore = new AdbWebCredentialStore();
      const connection = await device.connect();
      
      // 使用 AdbDaemonTransport.authenticate 进行认证并创建完整的 transport
      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection: connection,
        credentialStore: credentialStore,
      });
      
      const adb = new Adb(transport);
      setAdbInstance(adb);
      
      // 保存设备信息以便下次自动连接
      await deviceCredentialManager.saveDeviceInfo(device);
      
      // 路由跳转
      await router.push({
        path: "/dashboard",
      });
    } catch (e) {
      console.log(e)
      ElNotification.error({
        title: '连接失败',
        message: '连接失败，当前设备已被其他应用程序占用！请关闭其他程序再尝试连接',
        type: 'error',
        duration: 3000
      })
      connectStatus.value = 'disconnected'
    }
  } else {
    ElNotification.error({
      title: '连接失败',
      message: '连接失败，请检查设备是否已连接',
      type: 'error',
      duration: 3000
    })
    connectStatus.value = 'disconnected'
  }
}

// 控制指定div中每个元素的颜色，并随着时间变化
const changeColor = () => {
  const div = document.querySelector('.connectingCss');
  const divs = div.children;
  let i = 0;

  // 清除旧的定时器
  clearInterval(timerId);

  timerId = setInterval(() => {
    divs[i] && (divs[i].style.backgroundColor = '#409EFF');
    if (i > 0) {
      divs[i - 1].style.backgroundColor = '#393a3c';
    } else {
      divs[divs.length - 1].style.backgroundColor = '#393a3c';
    }
    i++;
    if (i === divs.length) {
      i = 0;
    }
  }, 800);
};

onMounted(async () => {
  localStorage.setItem('showHeader', 'false');
  
  // 首先检查是否有WebUSB支持
  if (!AdbDaemonWebUsbDeviceManager.BROWSER) {
    connectStatus.value = 'disconnected';
    return;
  }
  
  // 检查是否有存储的凭证
  await checkStoredCredentials();
  
  // 尝试自动连接
  const autoConnected = await tryAutoConnect();
  
  if (!autoConnected) {
    connectStatus.value = 'disconnected';
  }
})

// 离开页面时清除定时器
onBeforeUnmount(() => {
  clearInterval(timerId);
  localStorage.setItem('showHeader', 'true')
})
</script>
<style scoped>
.homeTitle {
  margin-top: 30px;
}

.showConnectImg {
  width: 400px;
  height: 150px
}

.computerImgCss {
  height: 100px;
  width: 100px
}

.horizontalLine {
  background-color: #a8a8a8;
  margin-top: 45px;
  margin-right: 4px;
  margin-left: 4px;
  flex-shrink: 0;
  height: 2px;
  width: 40px
}

.phoneImgCss {
  height: 80px;
  width: 80px;
  margin-top: 10px
}

.connectingCss {
  align-items: center;
  flex-direction: row;
  flex-shrink: 0;
  justify-content: center;
  column-gap: 20px;
  display: flex;
  width: 111px
}

.connecting-dot {
  background-color: #393a3c;
  border-radius: 50%;
  height: 13px;
  width: 13px;
  margin-bottom: 40px;
}

.device-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.device-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
}

.device-card.selected {
  border-color: #409EFF;
  background-color: #f0f9ff;
}
</style>