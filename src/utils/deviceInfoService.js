import { executeCommand, getAdbInstance } from "@/utils/adbManager.js";

/**
 * 从设备获取完整信息
 */
export const getDeviceInfo = async () => {
  try {
    const adb = getAdbInstance();
    if (!adb) {
      console.warn('ADB实例不可用');
      return null;
    }

    // 同步执行所有信息获取，提高效率
    const [
      deviceModel,
      manufacturer,
      androidVersion,
      sdkVersionCode,
      resolution,
      screenDensity,
      ipAddress,
      totalMemory,
      usedMemory,
      serialNumber,
      cpuInfo,
      cpuCore,
      cpuMin,
      cpuMax,
      cpuCur,
      brand,
      product,
      board,
      display,
      id,
      fingerPrint,
      host,
      hardware,
      device,
      user,
      radioVersion,
      tags,
      type,
      cpuAbi,
      abis,
      wifiName,
      batteryInfo,
      bootloader,
      abPartition,
      uptime,
      storageInfo,
      storageType,
      kernelVersion
    ] = await Promise.all([
      adb.getProp('ro.product.model').catch(() => '未知'),
      adb.getProp('ro.product.manufacturer').catch(() => '未知'),
      adb.getProp('ro.build.version.release').catch(() => '未知'),
      adb.getProp('ro.build.version.sdk').catch(() => '未知'),
      executeShellCommand(adb, "wm size | grep Physical").catch(() => ''),
      adb.getProp('ro.sf.lcd_density').catch(() => '未知'),
      executeShellCommand(adb, "ip addr show wlan0 | grep 'inet ' | cut -d' ' -f6 | cut -d/ -f1").catch(() => '未知'),
      executeShellCommand(adb, "free -m | awk '/Mem:/ {print $2}'").catch(() => '0'),
      executeShellCommand(adb, "free -m | awk '/Mem:/ {print $3}'").catch(() => '0'),
      adb.getProp('ro.serialno').catch(() => adb.serial || '未知'),
      adb.getProp('ro.hardware').catch(() => '未知'),
      executeShellCommand(adb, 'cat /proc/cpuinfo | grep processor | wc -l').catch(() => '0'),
      executeShellCommand(adb, 'cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_min_freq').catch(() => '未知'),
      executeShellCommand(adb, 'cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq').catch(() => '未知'),
      executeShellCommand(adb, 'cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq').catch(() => '未知'),
      adb.getProp('ro.product.brand').catch(() => '未知'),
      adb.getProp('ro.product.name').catch(() => '未知'),
      adb.getProp('ro.product.board').catch(() => '未知'),
      adb.getProp('ro.build.display.id').catch(() => '未知'),
      adb.getProp('ro.build.id').catch(() => '未知'),
      adb.getProp('ro.build.fingerprint').catch(() => '未知'),
      adb.getProp('ro.build.host').catch(() => '未知'),
      adb.getProp('ro.hardware').catch(() => '未知'),
      adb.getProp('ro.product.device').catch(() => '未知'),
      adb.getProp('ro.build.user').catch(() => '未知'),
      adb.getProp('gsm.version.baseband').catch(() => '未知'),
      adb.getProp('ro.build.tags').catch(() => '未知'),
      adb.getProp('ro.build.type').catch(() => '未知'),
      adb.getProp('ro.product.cpu.abi').catch(() => '未知'),
      adb.getProp('ro.product.cpu.abilist').catch(() => '未知'),
      getWifiInfo().catch(() => '未知'),
      getBatteryInfo().catch(() => ({ percentage: 0, voltage: 0, temperature: 0 })),
      executeShellCommand(adb, 'getprop ro.boot.verifiedbootstate').catch(() => '未知'),
      executeShellCommand(adb, 'getprop ro.boot.slot_suffix').catch(() => '未知'),
      executeShellCommand(adb, 'cat /proc/uptime | cut -d. -f1').catch(() => '0'),
      getStorageInfo().catch(() => ({ total: '0G', used: '0G', usedRate: 0 })),
      executeShellCommand(adb, 'getprop ro.boot.bootdevice').catch(() => '未知'),
      executeShellCommand(adb, 'uname -r').catch(() => '未知')
    ]);

    // 处理分辨率
    let formattedResolution = '未知';
    if (resolution) {
      const match = resolution.match(/Physical size: (\d+x\d+)/);
      formattedResolution = match ? match[1] : '未知';
    }

    // 处理CPU频率
    const formatCpuFreq = (freq) => {
      if (!freq || freq === '未知') return '未知';
      const freqNum = parseInt(freq.trim(), 10);
      return freqNum ? `${(freqNum / 1000).toFixed(0)} MHz` : '未知';
    };

    // 处理上电时间
    const formatUptime = (seconds) => {
      if (!seconds || isNaN(parseInt(seconds, 10))) return '未知';
      const uptimeSec = parseInt(seconds.trim(), 10);
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    };

    // 更新设备信息
    return {
      // 系统信息
      deviceModel: deviceModel || '未知',
      manufacturer: manufacturer || '未知',
      androidVersion: androidVersion || '未知',
      sdkVersionCode: sdkVersionCode || '未知',
      resolution: formattedResolution,
      screenDensity: `${screenDensity || '未知'} dpi`,
      serialNumber: serialNumber || '未知',
      brand: brand || '未知',
      product: product || '未知',
      board: board || '未知',
      display: display || '未知',
      id: id || '未知',
      fingerPrint: fingerPrint || '未知',
      host: host || '未知',
      hardware: hardware || '未知',
      device: device || '未知',
      user: user || '未知',
      radioVersion: radioVersion || '未知',
      tags: tags || '未知',
      type: type || '未知',
      bootloader: bootloader || '未知',
      abPartition: abPartition || '无',
      kernelVersion: kernelVersion || '未知',
      
      // 网络信息
      ipAddress: ipAddress || '未知',
      wifiName: wifiName || '未连接',
      
      // 硬件信息
      cpuInfo: cpuInfo || '未知',
      cpuCore: cpuCore ? `${cpuCore.trim()} 核` : '未知',
      cpuMin: formatCpuFreq(cpuMin),
      cpuMax: formatCpuFreq(cpuMax),
      cpuCur: formatCpuFreq(cpuCur),
      cpuAbi: cpuAbi || '未知',
      abis: abis || '未知',
      
      // 电池信息
      batteryPercentage: batteryInfo.percentage || 0,
      voltage: batteryInfo.voltage || 0,
      temperature: batteryInfo.temperature || 0,
      
      // 存储信息
      totalMemory: `${totalMemory.trim() || 0} MB`,
      usedMemory: `${usedMemory.trim() || 0} MB`,
      memoryUsedRate: parseInt(usedMemory || 0, 10) / parseInt(totalMemory || 1, 10) * 100 || 0,
      totalStorage: storageInfo.total || '0G',
      usedStorage: storageInfo.used || '0G',
      storageUsedRate: storageInfo.usedRate || 0,
      storageType: storageType || '未知',
      
      // 运行信息
      uptime: formatUptime(uptime)
    };

  } catch (e) {
    console.error('获取设备信息出错:', e);
    return null;
  }
};

/**
 * 执行shell命令并返回结果
 * @param {Object} device - ADB设备实例
 * @param {string} command - 要执行的shell命令
 * @returns {Promise<string>} 命令执行结果
 */
export const executeShellCommand = async (device, command) => {
  if (!device) return '';
  try {
    return await executeCommand(command);
  } catch (error) {
    console.error(`执行命令 ${command} 出错:`, error);
    return '';
  }
};

/**
 * 获取WiFi信息
 * @returns {Promise<string>} WiFi名称
 */
export const getWifiInfo = async () => {
  // 尝试多种WiFi信息获取方式
  const methods = [
    // 方法1: 使用cmd wifi status命令
    async () => {
      const res = await executeCommand('cmd wifi status');
      if (res) {
        const wifiRegex = /Wifi is connected to "(.*?)"/;
        const wifiMatch = res.match(wifiRegex);
        return wifiMatch ? wifiMatch[1] : null;
      }
      return null;
    },
    // 方法2: 使用dumpsys wifi命令
    async () => {
      const res = await executeCommand('dumpsys wifi | grep SSID');
      if (res) {
        // 更新正则表达式，使其更通用
        // 匹配 SSID: 后面的内容，到第一个逗号为止
        const wifiRegex = /SSID: ([^,]*),/;
        // 首先尝试匹配 mWifiInfo SSID: 格式的行
        const wifiInfoLine = res.split('\n').find(line => line.includes('mWifiInfo SSID:'));
        if (wifiInfoLine) {
          const wifiMatch = wifiInfoLine.match(wifiRegex);
          return wifiMatch ? wifiMatch[1].trim().replace(/"/g, '') : null;
        }
        // 如果没有匹配到mWifiInfo行，则尝试匹配任何包含SSID的行
        const wifiMatch = res.match(wifiRegex);
        return wifiMatch ? wifiMatch[1].trim().replace(/"/g, '') : null;
      }
      return null;
    }
  ];

  // 依次尝试所有方法
  for (const method of methods) {
    try {
      const result = await method();
      if (result) {
        return result;
      }
    } catch (e) {
      console.warn('WiFi信息获取方法失败:', e);
    }
  }

  return '未知';
};

/**
 * 获取电池信息
 * @returns {Promise<{percentage: number, voltage: number, temperature: number}>} 电池信息
 */
export const getBatteryInfo = async () => {
  try {
    const batteryInfo = await executeCommand('dumpsys battery');
    
    if (!batteryInfo) {
      return { percentage: 0, voltage: 0, temperature: 0 };
    }
    
    // 解析电量
    const levelMatch = batteryInfo.match(/level:\s*(\d+)/);
    const percentage = levelMatch ? parseInt(levelMatch[1], 10) : 0;
    
    // 解析电压
    const voltageMatch = batteryInfo.match(/voltage:\s*(\d+)/);
    const voltage = voltageMatch ? parseFloat(voltageMatch[1]) / 1000000 : 0;
    
    // 解析温度
    const temperatureMatch = batteryInfo.match(/temperature:\s*(\d+)/);
    const temperature = temperatureMatch ? parseInt(temperatureMatch[1], 10) / 10 : 0;
    
    return { percentage, voltage, temperature };
  } catch (e) {
    console.error('获取电池信息失败:', e);
    return { percentage: 0, voltage: 0, temperature: 0 };
  }
};

/**
 * 获取存储信息
 * @returns {Promise<{total: string, used: string, usedRate: number}>} 存储信息
 */
export const getStorageInfo = async () => {
  try {
    const res = await executeCommand('df -h | grep \'/data\'');
    
    if (res) {
      const storageRegex = /(\d+[GMK]) +(\d+[GMK]) +\d+[GMK] +(\d+)%/;
      const storageMatch = res.match(storageRegex);
      
      if (storageMatch && storageMatch.length >= 4) {
        return {
          total: storageMatch[1],
          used: storageMatch[2],
          usedRate: Number(storageMatch[3]),
        };
      }
    }
  } catch (e) {
    console.error('获取存储信息失败:', e);
  }
  
  return { total: '0G', used: '0G', usedRate: 0 };
};

/**
 * 获取CPU频率数据
 * @returns {Promise<Array<{timestamp: number, frequency: number}>>} CPU频率数据
 */
export const getCpuFrequencyData = async () => {
  const data = [];
  try {
    const res = await executeCommand('cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq');
    if (res) {
      const freq = parseInt(res.trim(), 10);
      data.push({ timestamp: Date.now(), frequency: freq / 1000 }); // 以MHz为单位
    }
  } catch (e) {
    console.warn('获取CPU频率数据失败:', e);
  }
  return data;
};

/**
 * 获取内存使用数据
 * @returns {Promise<Array<{timestamp: number, memory: number}>>} 内存使用数据
 */
export const getMemoryUsageData = async () => {
  const data = [];
  try {
    const res = await executeCommand('free -m | awk \'NR==2\' | awk \'{print $3}\''); // 获取已使用内存
    if (res) {
      const usedMemory = parseInt(res.trim(), 10);
      data.push({ timestamp: Date.now(), memory: usedMemory });
    }
  } catch (e) {
    console.warn('获取内存使用数据失败:', e);
  }
  return data;
};

/**
 * 根据电池百分比获取颜色
 * @param {number} percentage - 电池百分比
 * @returns {string} - 颜色代码
 */
export const getBatteryColor = (percentage) => {
  if (percentage >= 70) {
    return '#4CAF50'; // 绿色
  } else if (percentage >= 30) {
    return '#FF9800'; // 橙色
  } else {
    return '#F44336'; // 红色
  }
};

/**
 * 根据温度获取颜色
 * @param {number} temperature - 温度值（摄氏度）
 * @returns {string} - 颜色代码
 */
export const getTemperatureColor = (temperature) => {
  if (temperature <= 30) {
    return '#4CAF50'; // 绿色
  } else if (temperature <= 40) {
    return '#FF9800'; // 橙色
  } else {
    return '#F44336'; // 红色
  }
};

/**
 * 根据百分比获取进度条颜色
 * @param {number} percentage - 百分比值
 * @returns {string} - 颜色代码
 */
export const getProgressColor = (percentage) => {
  if (percentage <= 70) {
    return '#4CAF50'; // 绿色
  } else if (percentage <= 90) {
    return '#FF9800'; // 橙色
  } else {
    return '#F44336'; // 红色
  }
}; 