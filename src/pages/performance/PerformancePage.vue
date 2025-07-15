<template>
  <div class="performance-page">
    <div class="container">
      <!-- 控制面板 -->
      <el-card class="mb-4 control-panel-card">
        <div class="panel-container">
          <!-- 左侧：设置区域 -->
          <div class="left-panel">
            <div class="settings-group">
              <div class="setting-item">
                <div class="label"><el-icon><Menu /></el-icon> 监控应用</div>
                <el-select 
                  v-model="selectedPackage"
                  placeholder="选择一个应用开始监控"
                  :disabled="isMonitoring"
                  filterable
                  class="full-width"
                  @change="onAppSelected"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                  <el-option
                    v-for="app in installedApps"
                    :key="app.packageName"
                    :label="app.appName"
                    :value="app.packageName"
                  >
                    <span>{{ app.appName }}</span>
                    <span class="option-pkg">{{ app.packageName }}</span>
                  </el-option>
                </el-select>
              </div>
              
              <!-- 新增PID选择 -->
              <div class="setting-item" v-if="processList.length > 0">
                <div class="label"><el-icon><Phone /></el-icon> 选择进程</div>
                <el-select 
                  v-model="selectedPid"
                  placeholder="选择应用进程"
                  :disabled="isMonitoring"
                  class="full-width"
                >
                  <el-option
                    v-for="process in processList"
                    :key="process.pid"
                    :label="`PID: ${process.pid} | ${process.name}`"
                    :value="process.pid"
                  />
                </el-select>
              </div>
              
              <div class="setting-item">
                <div class="label"><el-icon><Timer /></el-icon> 采集间隔</div>
                <el-select 
                  v-model="collectionInterval"
                  :disabled="isMonitoring"
                  style="width: 150px"
                >
                  <el-option label="1 秒" value="1000" />
                  <el-option label="2 秒" value="2000" />
                  <el-option label="5 秒" value="5000" />
                  <el-option label="10 秒" value="10000" />
                </el-select>
                <el-button
                  type="warning"
                  @click="refreshAppList"
                  :disabled="isLoading || isMonitoring"
                  :loading="isLoading"
                  :icon="Timer"
                >刷新应用列表
                </el-button>
                <el-button
                  type="success"
                  @click="getCurrentApp"
                  :disabled="isLoading"
                  :loading="isGettingCurrentApp"
                  :icon="Search"
                >获取当前应用
                </el-button>
              </div>
              <div class="setting-item">
                <div class="label"><el-icon><DataAnalysis /></el-icon> 采集上限</div>
                <el-select 
                  v-model="localMaxDataPoints"
                  :disabled="isMonitoring"
                  style="width: 150px"
                  @change="updateMaxDataPoints"
                >
                  <el-option label="300 条 (默认)" :value="300" />
                  <el-option label="500 条" :value="500" />
                  <el-option label="1000 条" :value="1000" />
                  <el-option label="2000 条" :value="2000" />
                  <el-option label="5000 条" :value="5000" />
                  <el-option label="不限制" :value="0" />
                </el-select>
                <el-tooltip content="采集上限越打占用内存越大，不限制可能导致长时间监控时内存占用过高" placement="top">
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 右侧：状态显示和操作按钮区域 -->
          <div class="right-panel">
            <!-- 状态显示区域 -->
            <div class="status-display">
              <template v-if="isMonitoring">
                <div class="monitoring-status">
                  <div class="app-name">
                    <el-icon><Loading class="is-loading" /></el-icon>
                    <span>{{ currentAppName }}</span>
                  </div>
                  <div class="duration">
                    运行时长: {{ monitoringDuration }}
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="idle-status">
                  <el-icon><InfoFilled /></el-icon>
                  <span>待机中，请选择应用并开始监控</span>
                </div>
              </template>
            </div>
            
            <!-- 操作按钮区域 -->
            <div class="action-buttons-container">
              <div class="action-buttons">
                <el-button 
                  v-if="!isMonitoring" 
                  type="primary" 
                  @click="startMonitoring"
                  :disabled="!selectedPackage || isLoading"
                  class="action-btn"
                >
                  <el-icon class="mx-2"><VideoPlay /></el-icon>
                  开始监控
                </el-button>
                <el-button 
                  v-else 
                  type="danger" 
                  @click="stopMonitoring"
                  class="action-btn"
                >
                  <el-icon class="mx-2"><VideoPause /></el-icon>
                  停止监控
                </el-button>
                <el-button 
                  type="success"
                  @click="exportData"
                  :disabled="performanceStore.timeStamps.length === 0 || isMonitoring"
                  class="action-btn"
                >
                  <el-icon class="mx-2"><Download /></el-icon>
                  导出报告
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 实时数据展示 -->
        <el-divider v-if="isMonitoring" />
        <el-row :gutter="20" v-if="isMonitoring" class="live-stats">
          <el-col :span="6">
            <el-statistic title="CPU 使用率" :value="latestCpu">
              <template #suffix>%</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="内存占用" :value="latestMemory">
              <template #suffix>MB</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="实时帧率" :value="latestFps">
               <template #suffix>FPS</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="电池温度" :value="latestTemp">
              <template #suffix>°C</template>
            </el-statistic>
          </el-col>
          <!-- 前台应用信息 -->
          <el-col :span="24" class="mt-3">
            <el-card class="foreground-app-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <span class="title">当前前台应用</span>
                  <el-tag
                    :type="currentForegroundApp.packageName ? 'success' : 'info'"
                    size="small"
                  >
                    {{ currentForegroundApp.packageName ? '已检测' : '未检测' }}
                  </el-tag>
                </div>
              </template>

              <div v-if="currentForegroundApp.packageName" class="app-details">
                <div class="detail-row">
                  <span class="label">应用名称:</span>
                  <span class="value">{{ currentForegroundApp.appName || '未知' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">应用类型:</span>
                  <el-tag
                    size="small"
                    :type="currentForegroundApp.isSystemApp ? 'warning' : 'success'"
                  >
                    {{ currentForegroundApp.isSystemApp ? '系统应用' : '第三方应用' }}
                  </el-tag>
                </div>
                <div class="detail-row">
                  <span class="label">包名:</span>
                  <span class="value">{{ currentForegroundApp.packageName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">进程ID:</span>
                  <span class="value">{{ currentForegroundApp.pid || '未知' }}</span>
                </div>
              </div>

              <div v-else class="no-app">
                <span class="no-app-text">未检测到前台应用</span>
              </div>
            </el-card>
          </el-col>

          <el-col :span="24" class="data-info mt-2">
            <div class="data-point-info">
              <el-icon><InfoFilled /></el-icon>
              <span>
                已采集 {{ performanceStore.timeStamps.length }} 条数据
                {{ performanceStore.maxDataPoints > 0 ? `(最大 ${performanceStore.maxDataPoints} 个)` : '(无限制)' }}，
                图表显示最近60条数据，导出将包含全部数据。
              </span>
            </div>
          </el-col>
        </el-row>
      </el-card>
      
      <!-- 图表区域 -->
      <el-row :gutter="20">
        <!-- CPU使用率图表 -->
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h5 class="card-title">CPU使用率</h5>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="!isMonitoring" class="chart-empty-state">
                <div class="empty-chart-container">
                  <el-icon class="empty-icon"><Cpu /></el-icon>
                  <div class="empty-text">启动监控后将显示CPU使用率图表</div>
                </div>
              </div>
              <CpuChart v-else />
            </div>
          </el-card>
        </el-col>
        
        <!-- 内存使用图表 -->
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h5 class="card-title">内存使用</h5>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="!isMonitoring" class="chart-empty-state">
                <div class="empty-chart-container">
                  <el-icon class="empty-icon"><Histogram /></el-icon>
                  <div class="empty-text">启动监控后将显示内存使用图表</div>
                </div>
              </div>
              <MemoryChart v-else />
            </div>
          </el-card>
        </el-col>
        
        <!-- FPS图表 -->
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h5 class="card-title">FPS</h5>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="!isMonitoring" class="chart-empty-state">
                <div class="empty-chart-container">
                  <el-icon class="empty-icon"><DataAnalysis /></el-icon>
                  <div class="empty-text">启动监控后将显示FPS图表</div>
                </div>
              </div>
              <FpsChart v-else />
            </div>
          </el-card>
        </el-col>
        
        <!-- 网络流量图表 -->
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h5 class="card-title">网络流量</h5>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="!isMonitoring" class="chart-empty-state">
                <div class="empty-chart-container">
                  <el-icon class="empty-icon"><Connection /></el-icon>
                  <div class="empty-text">启动监控后将显示网络流量图表</div>
                </div>
              </div>
              <NetworkChart v-else />
            </div>
          </el-card>
        </el-col>
        
        <!-- 电池电量图表 -->
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h5 class="card-title">电池电量</h5>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="!isMonitoring" class="chart-empty-state">
                <div class="empty-chart-container">
                  <el-icon class="empty-icon"><Odometer /></el-icon>
                  <div class="empty-text">启动监控后将显示电池电量图表</div>
                </div>
              </div>
              <BatteryChart v-else />
            </div>
          </el-card>
        </el-col>
        
        <!-- 电池温度图表 -->
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h5 class="card-title">电池温度</h5>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="!isMonitoring" class="chart-empty-state">
                <div class="empty-chart-container">
                  <el-icon class="empty-icon"><Odometer /></el-icon>
                  <div class="empty-text">启动监控后将显示电池温度图表</div>
                </div>
              </div>
              <TemperatureChart v-else />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePerformanceStore } from '../../stores/performance';
import { useDeviceStore } from '../../stores/device';
import { getInstalledApps, getProcessList } from '../../utils/adbManager';
import {
  initMonitor,
  startMonitoring as startMonitoringAPI,
  stopMonitoring as stopMonitoringAPI,
  setMonitoringInterval
} from '../../utils/performance/performanceMonitor';
import { collectForegroundApp } from '../../utils/performance/collectors/foregroundAppCollector';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Cpu, Histogram, DataAnalysis, Connection, Odometer, VideoPlay, VideoPause, Download, Menu, Phone, Search, Timer, Clock, InfoFilled, Loading, Refresh } from '@element-plus/icons-vue';

// 导入图表组件
import CpuChart from './components/CpuChart.vue';
import MemoryChart from './components/MemoryChart.vue';
import FpsChart from './components/FpsChart.vue';
import NetworkChart from './components/NetworkChart.vue';
import BatteryChart from './components/BatteryChart.vue';
import TemperatureChart from './components/TemperatureChart.vue';

// 状态
const installedApps = ref([]);
const selectedPackage = ref('');
const isLoading = ref(false);
const collectionInterval = ref(1000);
const monitoringStartTime = ref(null);
const monitoringDuration = ref('');
let durationTimer = null;
const localMaxDataPoints = ref(300); // 本地状态用于绑定选择器
const processList = ref([]); // 存储进程列表
const selectedPid = ref(''); // 选中的进程ID
const isGettingCurrentApp = ref(false); // 获取当前应用的加载状态

// Store
const performanceStore = usePerformanceStore();
const deviceStore = useDeviceStore();

// 计算属性
const isMonitoring = computed(() => performanceStore.isMonitoring);
const currentAppName = computed(() => {
  if (!performanceStore.currentPackageName) return '';
  
  const app = installedApps.value.find(
    app => app.packageName === performanceStore.currentPackageName
  );
  return app ? app.appName : performanceStore.currentPackageName;
});

const latestCpu = computed(() => {
  const history = performanceStore.cpuAppHistory;
  return history.length > 0 ? history[history.length - 1] : 0;
});

const latestMemory = computed(() => {
  const history = performanceStore.memoryTotalHistory;
  return history.length > 0 ? history[history.length - 1] : 0;
});

const latestFps = computed(() => {
  const history = performanceStore.fpsHistory;
  return history.length > 0 ? history[history.length - 1] : 0;
});

const latestTemp = computed(() => {
  const history = performanceStore.batteryTemperatureHistory;
  return history.length > 0 ? history[history.length - 1] : 0;
});

// 当前前台应用信息
const currentForegroundApp = computed(() => performanceStore.currentForegroundAppInfo);

// 方法
const refreshAppList = async () => {
  isLoading.value = true;
  try {
    installedApps.value = await getInstalledApps(false);
  } catch (error) {
    console.error('获取应用列表失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 获取当前前台应用
const getCurrentApp = async () => {
  isGettingCurrentApp.value = true;
  try {
    const foregroundApp = await collectForegroundApp();

    if (foregroundApp && foregroundApp.packageName) {
      // 检查是否为系统应用
      if (foregroundApp.isSystemApp) {
        // 系统应用提示
        ElMessageBox.confirm(
          `检测到当前前台应用为系统内置应用：${foregroundApp.appName || foregroundApp.packageName}。\n\n系统应用的性能数据可能不够准确或有限制。\n\n是否仍要对此应用进行性能监控？`,
          '系统应用提示',
          {
            confirmButtonText: '继续监控',
            cancelButtonText: '取消',
            type: 'warning',
            center: true
          }
        ).then(async () => {
          // 用户选择继续监控
          await selectAndMonitorApp(foregroundApp);
        }).catch(() => {
          // 用户取消
          ElMessage.info({
            message: '已取消对系统应用的监控',
            duration: 2000
          });
        });
      } else {
        // 第三方应用，直接选择
        await selectAndMonitorApp(foregroundApp);
      }
    } else {
      ElMessage.warning({
        message: '未检测到前台应用，请确保设备上有应用正在运行',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('获取当前应用失败:', error);
    ElMessage.error({
      message: '获取当前应用失败，请检查设备连接',
      duration: 3000
    });
  } finally {
    isGettingCurrentApp.value = false;
  }
};

// 选择并准备监控应用
const selectAndMonitorApp = async (foregroundApp) => {
  try {
    // 检查应用是否在已安装应用列表中
    const existingApp = installedApps.value.find(app => app.packageName === foregroundApp.packageName);

    if (existingApp) {
      // 如果应用在列表中，直接选择
      selectedPackage.value = foregroundApp.packageName;
      await onAppSelected(foregroundApp.packageName);
    } else {
      // 如果应用不在列表中，添加到列表并选择
      const newApp = {
        packageName: foregroundApp.packageName,
        appName: foregroundApp.appName || foregroundApp.packageName
      };
      installedApps.value.unshift(newApp);
      selectedPackage.value = foregroundApp.packageName;
      await onAppSelected(foregroundApp.packageName);
    }

    // 成功消息
    const appType = foregroundApp.isSystemApp ? '系统应用' : '第三方应用';
    const addedText = existingApp ? '' : '（已添加到应用列表）';

    ElMessage.success({
      message: `已获取当前前台${appType}: ${foregroundApp.appName || foregroundApp.packageName}${addedText}`,
      duration: 3000
    });
  } catch (error) {
    console.error('选择应用失败:', error);
    ElMessage.error({
      message: '选择应用失败，请重试',
      duration: 3000
    });
  }
};

const onAppSelected = async (packageName) => {
  if (!packageName) {
    processList.value = [];
    selectedPid.value = '';
    return;
  }
  
  isLoading.value = true;
  try {
    const processes = await getProcessList(packageName);
    processList.value = processes;
    
    // 如果只有一个进程，自动选择
    if (processes.length === 1) {
      selectedPid.value = processes[0].pid;
    } else if (processes.length > 1) {
      // 默认选择第一个进程
      selectedPid.value = processes[0].pid;
    } else {
      selectedPid.value = '';
      ElMessage.warning(`未找到应用 ${packageName} 的进程`);
    }
  } catch (error) {
    console.error('获取进程列表失败:', error);
    ElMessage.error('获取进程列表失败');
    processList.value = [];
    selectedPid.value = '';
  } finally {
    isLoading.value = false;
  }
};

const startMonitoring = async () => {
  if (!selectedPackage.value) {
    ElMessage.warning('请先选择要监控的应用');
    return;
  }

  if (!selectedPid.value && processList.value.length > 0) {
    ElMessage.warning('请选择要监控的进程');
    return;
  }

  isLoading.value = true;
  try {
    // 启动监控
    const success = await startMonitoringAPI(selectedPackage.value, selectedPid.value);
    if (success) {
      // 记录开始时间
      monitoringStartTime.value = new Date();
      
      // 启动计时器，更新运行时长
      durationTimer = setInterval(() => {
        updateDuration();
      }, 1000);
      
      ElMessage.success(`已开始监控 ${selectedPackage.value}`);
    } else {
      ElMessage.error('启动监控失败');
    }
  } catch (error) {
    console.error('启动监控时出错:', error);
    ElMessage.error('启动监控失败: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

const stopMonitor = () => {
  // 停止监控
  stopMonitoringAPI();
  
  // 清除计时器
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
  
  // 显示消息
  ElMessage.info('性能监控已停止');
  
  // 检查数据一致性
  checkDataConsistency();
};

// 将函数赋值给变量，以便在模板中使用
const stopMonitoring = stopMonitor;

/**
 * 检查数据一致性，确保所有数据数组长度相同
 */
const checkDataConsistency = () => {
  const timeStampsLength = performanceStore.timeStamps.length;
  if (timeStampsLength === 0) return;
  
  const dataLengths = {
    timeStamps: timeStampsLength,
    cpuApp: performanceStore.cpuAppHistory.length,
    cpuSystem: performanceStore.cpuSystemHistory.length,
    memoryTotal: performanceStore.memoryTotalHistory.length,
    batteryLevel: performanceStore.batteryLevelHistory.length,
    batteryTemperature: performanceStore.batteryTemperatureHistory.length,
    networkRx: performanceStore.networkRxHistory.length,
    networkTx: performanceStore.networkTxHistory.length,
    fps: performanceStore.fpsHistory.length,
    jankCount: performanceStore.jankCountHistory.length
  };
  
  const allEqual = Object.values(dataLengths).every(len => len === timeStampsLength);
  
  if (!allEqual) {
    console.warn('数据长度不一致，可能影响图表显示:', dataLengths);
    
    // 尝试修复数据长度不一致的问题
    Object.entries(dataLengths).forEach(([key, length]) => {
      if (key !== 'timeStamps' && length !== timeStampsLength) {
        console.warn(`${key}数据长度(${length})与timeStamps长度(${timeStampsLength})不一致`);
      }
    });
  } else {
    console.log('数据长度一致性检查通过:', timeStampsLength);
  }
};

/**
 * 导出性能数据为CSV文件
 */
const exportData = () => {
  // 检查是否有数据
  if (performanceStore.timeStamps.length === 0) {
    ElMessage.warning('没有可导出的数据');
    return;
  }
  
  // 检查数据一致性
  checkDataConsistency();
  
  // 准备CSV头
  let csvContent = 'Timestamp,CPU App(%),CPU System(%),Memory(MB),Battery(%),Temperature(°C),Network Download(KB/s),Network Upload(KB/s),FPS,Jank Count\n';
  
  // 添加数据行
  const timeStamps = performanceStore.timeStamps;
  for (let i = 0; i < timeStamps.length; i++) {
    const row = [
      timeStamps[i],
      performanceStore.cpuAppHistory[i] || '',
      performanceStore.cpuSystemHistory[i] || '',
      performanceStore.memoryTotalHistory[i] || '',
      performanceStore.batteryLevelHistory[i] || '',
      performanceStore.batteryTemperatureHistory[i] || '',
      performanceStore.networkRxHistory[i] || '',
      performanceStore.networkTxHistory[i] || '',
      performanceStore.fpsHistory[i] || '',
      performanceStore.jankCountHistory[i] || ''
    ].join(',');
    
    csvContent += row + '\n';
  }
  
  // 创建Blob对象
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // 设置下载属性
  link.setAttribute('href', url);
  link.setAttribute('download', `performance_data_${selectedPackage.value}_${new Date().toISOString().replace(/:/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  
  // 添加到文档并触发下载
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  ElMessage.success('数据导出成功');
};

// 设置最大数据点数量
const updateMaxDataPoints = (value) => {
  // 更新store中的配置
  performanceStore.setMaxDataPoints(value);
  
  const message = value === 0 
    ? '已设置为不限制数据点数量，长时间监控可能会占用较多内存' 
    : `最大数据点数量已设置为 ${value} 个`;
  
  ElMessage.success(message);
};

// 更新监控持续时间
const updateDuration = () => {
  if (!monitoringStartTime.value) return;
  
  const now = new Date();
  const diff = now - monitoringStartTime.value;
  
  // 格式化持续时间
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  monitoringDuration.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 生命周期钩子
onMounted(async () => {
  // 初始化监控器
  initMonitor();
  
  // 设置初始最大数据点数量
  localMaxDataPoints.value = performanceStore.maxDataPoints || 300;
  performanceStore.setMaxDataPoints(localMaxDataPoints.value);
  
  // 加载应用列表
  await refreshAppList();
});


</script>

<style scoped>
.performance-page {
  padding: 0;
  width: 100%;
  height: 100%;
}

.container {
  width: 100%;
  max-width: none;
  padding: 20px;
}

.control-panel-card {
  --el-card-padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.1);
  overflow: visible;
}

.panel-container {
  display: flex;
  gap: 30px;
}

.left-panel {
  flex: 2; /* 左侧占更多空间 */
  padding-right: 20px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  border-left: 1px solid #ebeef5;
  padding-left: 20px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-item .label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.full-width {
  flex-grow: 1;
}

.option-pkg {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
  float: right;
}

.status-display {
  padding: 12px 20px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  min-width: 280px;
  margin-bottom: 30px;
  width: 100%;
  text-align: center;
}

.action-buttons-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
  margin-top: 10px;
}

.action-btn {
  height: 40px;
  font-size: 14px;
}

.idle-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  justify-content: center;
}

.monitoring-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 500;
}

.app-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--el-text-color-primary);
  justify-content: center;
}

.duration {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.live-stats {
  margin-top: 20px;
  padding-top: 10px;
}

.live-stats .el-statistic__head {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.live-stats .el-statistic__content {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.data-info {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.data-point-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.info-icon {
  color: var(--el-color-info);
  cursor: help;
}

.chart-card {
  min-height: 400px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.chart-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: #f9f9fb;
  height: 300px;
  width: 100%;
  border-radius: 8px;
}

.empty-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  width: 80%;
  max-width: 300px;
  transition: transform 0.3s ease;
}

.empty-chart-container:hover {
  transform: translateY(-5px);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  color: #C0C4CC;
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.empty-text {
  font-size: 14px;
  text-align: center;
  color: #909399;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .panel-container {
    flex-direction: column;
  }
  
  .right-panel {
    border-left: none;
    border-top: 1px solid #ebeef5;
    padding-left: 0;
    padding-top: 20px;
    margin-top: 20px;
  }
  
  .status-display {
    margin-top: 0;
  }
  
  .action-buttons {
    margin-top: 20px;
  }
}

/* 前台应用信息卡片样式 */
.foreground-app-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafbfc;
}

.foreground-app-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
}

.foreground-app-card .title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.detail-row .label {
  font-weight: 500;
  color: #606266;
  font-size: 13px;
  min-width: 70px;
}

.detail-row .value {
  color: #303133;
  font-size: 13px;
  word-break: break-all;
  text-align: right;
  flex: 1;
  margin-left: 12px;
}

.no-app {
  text-align: center;
  padding: 8px 0;
}

.no-app-text {
  color: #909399;
  font-size: 13px;
}
</style> 