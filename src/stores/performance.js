// 性能数据状态管理
// 这个文件将用于集中管理所有性能指标的时间序列数据 

import { defineStore } from 'pinia';

export const usePerformanceStore = defineStore('performance', {
  state: () => ({
    // CPU相关数据
    cpuAppHistory: [],
    cpuSystemHistory: [],
    
    // 内存相关数据
    memoryTotalHistory: [],
    memoryDetailHistory: [], // 包含Java Heap、Native Heap等详细内存数据
    
    // 电池相关数据
    batteryLevelHistory: [],
    batteryTemperatureHistory: [],
    
    // 网络相关数据
    networkRxHistory: [], // 下载流量
    networkTxHistory: [], // 上传流量
    
    // FPS相关数据
    fpsHistory: [],
    jankCountHistory: [], // 卡顿次数
    
    // GPU相关数据
    gpuUsageHistory: [],
    
    // 磁盘相关数据
    diskUsageHistory: [],
    
    // 时间戳数据，用于X轴显示
    timeStamps: [],
    
    // 监控状态
    isMonitoring: false,
    
    // 当前监控的应用包名
    currentPackageName: '',
    
    // 当前监控的应用PID
    currentPid: null,
    
    // 最大历史数据点数量，0表示不限制
    maxDataPoints: 300,
  }),
  
  actions: {
    /**
     * 设置最大数据点数量
     * @param {number} maxPoints - 最大数据点数量，0表示不限制
     */
    setMaxDataPoints(maxPoints) {
      if (typeof maxPoints === 'number' && maxPoints >= 0) {
        this.maxDataPoints = maxPoints;
        console.log(`最大数据点数量已设置为: ${maxPoints === 0 ? '无限制' : maxPoints}`);
      }
    },
    
    /**
     * 添加性能数据点
     * @param {string} metric - 性能指标名称，如'cpuApp', 'memory'等
     * @param {any} value - 性能指标值
     * @param {Date|string} [timestamp=new Date()] - 数据点的时间戳
     * @param {boolean} [addTimestamp=false] - 是否添加时间戳到timeStamps数组
     */
    addDataPoint(metric, value, timestamp = new Date(), addTimestamp = false) {
      
      // 格式化时间戳为字符串
      const timeString = typeof timestamp === 'string' 
        ? timestamp 
        : timestamp.toLocaleTimeString('zh-CN', { hour12: false });
      
      // 如果需要，则添加时间戳。这是全局的，确保每个周期只添加一次。
      if (addTimestamp) {
        this.addToLimitedArray(this.timeStamps, timeString);
      }
      
      // 如果只是为了添加时间戳，则在此处返回
      if (metric === 'timestamp-only') {
        return;
      }

      // 根据指标类型添加到对应的历史数组
      switch (metric) {
        case 'cpuApp':
          this.addToLimitedArray(this.cpuAppHistory, value);
          break;
        case 'cpuSystem':
          this.addToLimitedArray(this.cpuSystemHistory, value);
          break;
        case 'memoryTotal':
          this.addToLimitedArray(this.memoryTotalHistory, value);
          break;
        case 'memoryDetail':
          this.addToLimitedArray(this.memoryDetailHistory, value);
          break;
        case 'batteryLevel':
          this.addToLimitedArray(this.batteryLevelHistory, value);
          break;
        case 'batteryTemperature':
          this.addToLimitedArray(this.batteryTemperatureHistory, value);
          break;
        case 'networkRx':
          this.addToLimitedArray(this.networkRxHistory, value);
          break;
        case 'networkTx':
          this.addToLimitedArray(this.networkTxHistory, value);
          break;
        case 'fps':
          this.addToLimitedArray(this.fpsHistory, value);
          break;
        case 'jankCount':
          this.addToLimitedArray(this.jankCountHistory, value);
          break;
        case 'gpuUsage':
          this.addToLimitedArray(this.gpuUsageHistory, value);
          break;
        case 'diskUsage':
          this.addToLimitedArray(this.diskUsageHistory, value);
          break;
      }
    },
    
    /**
     * 添加元素到有限大小的数组，保持数组不超过最大长度
     * @param {Array} array - 目标数组
     * @param {any} value - 要添加的值
     */
    addToLimitedArray(array, value) {
      array.push(value);
      // 如果设置了最大数据点数量且数组长度超过该值，则移除最旧的数据点
      if (this.maxDataPoints > 0 && array.length > this.maxDataPoints) {
        array.shift(); // 移除最旧的数据点
      }
    },
    
    /**
     * 清空所有历史数据
     */
    clearHistory() {
      this.cpuAppHistory = [];
      this.cpuSystemHistory = [];
      this.memoryTotalHistory = [];
      this.memoryDetailHistory = [];
      this.batteryLevelHistory = [];
      this.batteryTemperatureHistory = [];
      this.networkRxHistory = [];
      this.networkTxHistory = [];
      this.fpsHistory = [];
      this.jankCountHistory = [];
      this.gpuUsageHistory = [];
      this.diskUsageHistory = [];
      this.timeStamps = [];
    },
    
    /**
     * 设置监控状态
     * @param {boolean} status - 是否正在监控
     */
    setMonitoringStatus(status) {
      this.isMonitoring = status;
    },
    
    /**
     * 设置当前监控的应用信息
     * @param {string} packageName - 应用包名
     * @param {string|null} pid - 应用进程ID
     */
    setCurrentApp(packageName, pid = null) {
      this.currentPackageName = packageName;
      this.currentPid = pid;
      
      // 切换应用时清空历史数据
      this.clearHistory();
    }
  },
  
  getters: {
    /**
     * 获取最近的CPU使用率数据
     */
    latestCpuData(state) {
      const appCpu = state.cpuAppHistory.length > 0 
        ? state.cpuAppHistory[state.cpuAppHistory.length - 1] 
        : 0;
      
      const systemCpu = state.cpuSystemHistory.length > 0 
        ? state.cpuSystemHistory[state.cpuSystemHistory.length - 1] 
        : 0;
        
      return { appCpu, systemCpu };
    },
    
    /**
     * 获取最近的内存使用数据
     */
    latestMemoryData(state) {
      return state.memoryTotalHistory.length > 0 
        ? state.memoryTotalHistory[state.memoryTotalHistory.length - 1] 
        : 0;
    },
    
    /**
     * 获取最近的FPS数据
     */
    latestFpsData(state) {
      return state.fpsHistory.length > 0 
        ? state.fpsHistory[state.fpsHistory.length - 1] 
        : 0;
    },
    
    /**
     * 获取最近的电池数据
     */
    latestBatteryData(state) {
      const level = state.batteryLevelHistory.length > 0 
        ? state.batteryLevelHistory[state.batteryLevelHistory.length - 1] 
        : 0;
        
      const temperature = state.batteryTemperatureHistory.length > 0 
        ? state.batteryTemperatureHistory[state.batteryTemperatureHistory.length - 1] 
        : 0;
        
      return { level, temperature };
    },
    
    /**
     * 获取最近的网络数据
     */
    latestNetworkData(state) {
      const rx = state.networkRxHistory.length > 0 
        ? state.networkRxHistory[state.networkRxHistory.length - 1] 
        : 0;
        
      const tx = state.networkTxHistory.length > 0 
        ? state.networkTxHistory[state.networkTxHistory.length - 1] 
        : 0;
        
      return { rx, tx };
    },
    
    /**
     * 获取所有性能数据，用于图表展示
     */
    allPerformanceData(state) {
      return {
        timeStamps: state.timeStamps,
        cpu: {
          app: state.cpuAppHistory,
          system: state.cpuSystemHistory
        },
        memory: {
          total: state.memoryTotalHistory,
          detail: state.memoryDetailHistory
        },
        battery: {
          level: state.batteryLevelHistory,
          temperature: state.batteryTemperatureHistory
        },
        network: {
          rx: state.networkRxHistory,
          tx: state.networkTxHistory
        },
        fps: {
          value: state.fpsHistory,
          jank: state.jankCountHistory
        },
        gpu: state.gpuUsageHistory,
        disk: state.diskUsageHistory
      };
    }
  }
}); 