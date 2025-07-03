// 性能监控服务
// 该文件负责启动、停止和管理数据采集的定时任务

import { executeCommand } from '../adbManager';
import { usePerformanceStore } from '../../stores/performance';

// 导入所有采集器
import { collectCpuUsage } from './collectors/cpuCollector';
import { collectMemoryUsage, collectDetailedMemoryUsage } from './collectors/memoryCollector';
import { collectBatteryInfo, resetBatteryCollector } from './collectors/batteryCollector';
import { collectNetworkUsage, resetNetworkCollector } from './collectors/networkCollector';
import { collectFps, resetFpsCollector } from './collectors/fpsCollector';

class PerformanceMonitor {
  constructor() {
    this.monitorInterval = null;
    this.intervalTime = 1000; // 默认采集间隔为1秒
    this.isRunning = false;
    this.packageName = null;
    this.pid = null;
    this.performanceStore = null;
    this.dataPointCount = 0; // 记录采集的数据点数量
  }

  /**
   * 初始化性能监控器
   * 在Vue组件中使用前必须先调用此方法
   */
  init() {
    // 获取Pinia store实例
    this.performanceStore = usePerformanceStore();
  }

  /**
   * 获取应用的进程ID
   * @param {string} packageName - 应用包名
   * @returns {Promise<string|null>} - 进程ID或null（如果未找到）
   */
  async getPid(packageName) {
    try {
      // 使用ps命令查找应用进程
      const result = await executeCommand(`ps -A | grep ${packageName}`);
      
      if (!result) {
        console.warn(`未找到应用 ${packageName} 的进程`);
        return null;
      }
      
      // 解析输出获取PID
      // ps命令输出格式: USER PID PPID ... NAME
      const lines = result.trim().split('\n');
      for (const line of lines) {
        // 确保这行确实包含我们要找的包名
        if (line.includes(packageName)) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            return parts[1]; // PID通常是第二列
          }
        }
      }
      
      console.warn(`无法从ps输出中解析 ${packageName} 的PID`);
      return null;
    } catch (error) {
      console.error('获取PID时出错:', error);
      return null;
    }
  }

  /**
   * 设置数据采集间隔时间
   * @param {number} milliseconds - 间隔时间（毫秒）
   */
  setIntervalTime(milliseconds) {
    if (milliseconds >= 500) { // 最小间隔500毫秒，避免过于频繁的采集
      this.intervalTime = milliseconds;
      console.log(`采集间隔已设置为 ${milliseconds} 毫秒`);
      
      // 如果监控已经在运行，则重启以应用新的间隔时间
      if (this.isRunning) {
        this.stop();
        this.start(this.packageName);
      }
    } else {
      console.warn('采集间隔不能小于500毫秒');
    }
  }

  /**
   * 重置所有采集器状态
   * 在开始新的监控会话前调用
   */
  resetCollectors() {
    console.log('重置所有采集器状态');
    resetNetworkCollector();
    resetFpsCollector();
    resetBatteryCollector();
    this.dataPointCount = 0;
  }

  /**
   * 启动性能监控
   * @param {string} packageName - 要监控的应用包名
   * @param {string} [pid] - 应用进程ID，如果提供则直接使用，否则尝试获取
   * @returns {Promise<boolean>} - 是否成功启动
   */
  async start(packageName, pid = null) {
    if (!this.performanceStore) {
      console.error('性能监控器尚未初始化，请先调用init()方法');
      return false;
    }
    
    if (this.isRunning) {
      console.warn('性能监控已经在运行中');
      return false;
    }
    
    if (!packageName) {
      console.error('启动监控失败：未提供应用包名');
      return false;
    }
    
    this.packageName = packageName;
    
    // 如果提供了PID，直接使用
    if (pid) {
      this.pid = pid;
    } else {
      // 否则尝试获取应用PID
      this.pid = await this.getPid(packageName);
    }
    
    if (!this.pid) {
      console.error(`无法获取应用 ${packageName} 的PID，监控启动失败`);
      return false;
    }
    
    // 更新store中的应用信息
    this.performanceStore.setCurrentApp(packageName, this.pid);
    
    // 重置所有采集器状态
    this.resetCollectors();
    
    // 启动定时采集任务
    this.monitorInterval = setInterval(async () => {
      await this.collectPerformanceData();
    }, this.intervalTime);
    
    this.isRunning = true;
    this.performanceStore.setMonitoringStatus(true);
    
    console.log(`已启动对 ${packageName} (PID: ${this.pid}) 的性能监控，间隔: ${this.intervalTime}ms`);
    return true;
  }

  /**
   * 停止性能监控
   */
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.isRunning = false;
    if (this.performanceStore) {
      this.performanceStore.setMonitoringStatus(false);
    }
    
    console.log('性能监控已停止');
  }

  /**
   * 收集性能数据
   * 调用各个采集器并将数据存储到Pinia store中
   * @private
   */
  async collectPerformanceData() {
    if (!this.performanceStore || !this.isRunning) return;

    const timestamp = new Date();
    this.dataPointCount++;

    try {
      // 1. 并行执行所有采集器
      const results = await Promise.allSettled([
        collectCpuUsage(this.pid),
        collectMemoryUsage(this.pid),
        collectDetailedMemoryUsage(this.pid),
        collectBatteryInfo(),
        collectNetworkUsage(this.packageName),
        collectFps(this.packageName),
      ]);

      const [
        cpuResult,
        memoryResult,
        detailedMemoryResult,
        batteryResult,
        networkResult,
        fpsResult,
      ] = results;

      // 2. 每个采集周期只添加一次时间戳，确保所有数据对齐
      this.performanceStore.addDataPoint('timestamp-only', null, timestamp, true);

      // 3. 处理每个采集器的结果，失败则填充null
      // --- CPU ---
      if (cpuResult.status === 'fulfilled' && cpuResult.value) {
        this.performanceStore.addDataPoint('cpuApp', cpuResult.value.appCpu, timestamp, false);
        this.performanceStore.addDataPoint('cpuSystem', cpuResult.value.systemCpu, timestamp, false);
      } else {
        this.performanceStore.addDataPoint('cpuApp', null, timestamp, false);
        this.performanceStore.addDataPoint('cpuSystem', null, timestamp, false);
        console.warn('采集CPU数据失败:', cpuResult.reason || '未知错误');
      }

      // --- 内存 ---
      if (memoryResult.status === 'fulfilled' && memoryResult.value) {
        this.performanceStore.addDataPoint('memoryTotal', memoryResult.value.totalPss, timestamp, false);
      } else {
        this.performanceStore.addDataPoint('memoryTotal', null, timestamp, false);
        console.warn('采集内存数据失败:', memoryResult.reason || '未知错误');
      }
      if (detailedMemoryResult.status === 'fulfilled' && detailedMemoryResult.value) {
        this.performanceStore.addDataPoint('memoryDetail', detailedMemoryResult.value, timestamp, false);
      } else {
        this.performanceStore.addDataPoint('memoryDetail', null, timestamp, false);
        console.warn('采集详细内存数据失败:', detailedMemoryResult.reason || '未知错误');
      }

      // --- 电池 ---
      if (batteryResult.status === 'fulfilled' && batteryResult.value) {
        this.performanceStore.addDataPoint('batteryLevel', batteryResult.value.level, timestamp, false);
        this.performanceStore.addDataPoint('batteryTemperature', batteryResult.value.temperature, timestamp, false);
      } else {
        this.performanceStore.addDataPoint('batteryLevel', null, timestamp, false);
        this.performanceStore.addDataPoint('batteryTemperature', null, timestamp, false);
        console.warn('采集电池数据失败:', batteryResult.reason || '未知错误');
      }

      // --- 网络 ---
      if (networkResult.status === 'fulfilled' && networkResult.value) {
        this.performanceStore.addDataPoint('networkRx', networkResult.value.download, timestamp, false);
        this.performanceStore.addDataPoint('networkTx', networkResult.value.upload, timestamp, false);
      } else {
        this.performanceStore.addDataPoint('networkRx', null, timestamp, false);
        this.performanceStore.addDataPoint('networkTx', null, timestamp, false);
        console.warn('采集网络数据失败:', networkResult.reason || '未知错误');
      }

      // --- FPS ---
      if (fpsResult.status === 'fulfilled' && fpsResult.value) {
        this.performanceStore.addDataPoint('fps', fpsResult.value.fps, timestamp, false);
        this.performanceStore.addDataPoint('jankCount', fpsResult.value.jank, timestamp, false);
      } else {
        this.performanceStore.addDataPoint('fps', null, timestamp, false);
        this.performanceStore.addDataPoint('jankCount', null, timestamp, false);
        console.warn('采集FPS数据失败:', fpsResult.reason || '未知错误');
      }

      // 4. 检查数据对齐情况
      this.checkDataAlignment();

      console.log(`[${timestamp.toLocaleTimeString()}] 完成第${this.dataPointCount}轮性能数据采集 for ${this.packageName}`);
    } catch (error) {
      console.error('性能数据采集过程中发生错误:', error);
      
      // 即使发生错误，也要确保所有数据数组长度一致
      this.performanceStore.addDataPoint('timestamp-only', null, timestamp, true);
      this.performanceStore.addDataPoint('cpuApp', null, timestamp, false);
      this.performanceStore.addDataPoint('cpuSystem', null, timestamp, false);
      this.performanceStore.addDataPoint('memoryTotal', null, timestamp, false);
      this.performanceStore.addDataPoint('memoryDetail', null, timestamp, false);
      this.performanceStore.addDataPoint('batteryLevel', null, timestamp, false);
      this.performanceStore.addDataPoint('batteryTemperature', null, timestamp, false);
      this.performanceStore.addDataPoint('networkRx', null, timestamp, false);
      this.performanceStore.addDataPoint('networkTx', null, timestamp, false);
      this.performanceStore.addDataPoint('fps', null, timestamp, false);
      this.performanceStore.addDataPoint('jankCount', null, timestamp, false);
    }
  }

  /**
   * 检查各个数据数组是否对齐
   * 如果发现不一致，记录警告并尝试修复
   */
  checkDataAlignment() {
    if (!this.performanceStore) return;
    
    const store = this.performanceStore;
    const timestampsLength = store.timeStamps.length;
    
    // 检查所有数据数组长度
    const lengths = {
      timeStamps: timestampsLength,
      cpuApp: store.cpuAppHistory.length,
      cpuSystem: store.cpuSystemHistory.length,
      memoryTotal: store.memoryTotalHistory.length,
      batteryLevel: store.batteryLevelHistory.length,
      batteryTemperature: store.batteryTemperatureHistory.length,
      networkRx: store.networkRxHistory.length,
      networkTx: store.networkTxHistory.length,
      fps: store.fpsHistory.length,
      jankCount: store.jankCountHistory.length
    };
    
    // 检查是否所有数组长度一致
    const allEqual = Object.values(lengths).every(len => len === timestampsLength);
    
    if (!allEqual) {
      console.warn('数据数组长度不一致，可能导致图表显示问题:', lengths);
      
      // 尝试修复：为长度不足的数组填充null值
      Object.entries(lengths).forEach(([key, length]) => {
        if (key !== 'timeStamps' && length < timestampsLength) {
          const diff = timestampsLength - length;
          console.log(`修复 ${key} 数组长度不足，填充 ${diff} 个null值`);
          
          // 根据key获取对应的数组名称
          const arrayName = key + (key === 'memoryTotal' ? 'History' : 'History');
          
          // 填充null值
          for (let i = 0; i < diff; i++) {
            store[arrayName].push(null);
          }
        }
      });
    }
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();

// 导出一些便捷方法
export const startMonitoring = async (packageName, pid = null) => {
  // 初始化监控器
  initMonitor();
  
  // 清空之前的性能数据
  performanceMonitor.performanceStore?.clearHistory();
  
  // 启动监控
  return await performanceMonitor.start(packageName, pid);
};

export const stopMonitoring = () => {
  performanceMonitor.stop();
};

export const setMonitoringInterval = (milliseconds) => {
  performanceMonitor.setIntervalTime(milliseconds);
};

export const initMonitor = () => {
  performanceMonitor.init();
}; 