/**
 * CPU使用率采集器
 * 参考solox的逻辑，通过读取/proc/stat和/proc/<pid>/stat文件计算CPU使用率
 */

import {executeCommand} from '../../adbManager';

// 用于存储上一次的CPU统计数据
let previousCpuStats = {
  processCpuTime: 0,
  totalCpuTime: 0,
  idleCpuTime: 0,
  timestamp: 0,
};

/**
 * 获取进程的CPU统计数据
 * @param {string} pid - 进程ID
 * @returns {Promise<number>} - 进程CPU时间
 */
async function getProcessCpuStat(pid) {
  try {
    const cmd = `cat /proc/${pid}/stat`;
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      console.warn(`无法获取进程 ${pid} 的CPU统计信息`);
      return 0;
    }
    
    // 解析进程CPU时间
    // /proc/<pid>/stat格式：pid comm state ppid ... utime stime cutime cstime ...
    // utime(14), stime(15), cutime(16), cstime(17)是我们需要的CPU时间字段
    const tokens = result.trim().split(/\s+/);
    if (tokens.length < 17) {
      console.warn(`进程 ${pid} 的stat输出格式异常: ${result}`);
      return 0;
    }
    
    // 计算进程总CPU时间 (utime + stime + cutime + cstime)
    return parseFloat(tokens[13]) + parseFloat(tokens[14]) +
        parseFloat(tokens[15]) + parseFloat(tokens[16]);
  } catch (error) {
    console.error('获取进程CPU统计数据时出错:', error);
    return 0;
  }
}

/**
 * 获取系统总CPU统计数据
 * @returns {Promise<number>} - 系统总CPU时间
 */
async function getTotalCpuStat() {
  try {
    const cmd = 'cat /proc/stat | grep ^cpu ';
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      console.warn('无法获取系统CPU统计信息');
      return 0;
    }
    
    // 解析系统CPU时间
    // /proc/stat中cpu行格式：cpu user nice system idle iowait irq softirq steal guest guest_nice
    const tokens = result.trim().split(/\s+/);
    if (tokens.length < 8) {
      console.warn(`系统CPU统计输出格式异常: ${result}`);
      return 0;
    }
    
    // 计算总CPU时间 (sum of all times)
    let totalCpuTime = 0;
    for (let i = 1; i < 8; i++) {
      totalCpuTime += parseFloat(tokens[i]);
    }
    
    return totalCpuTime;
  } catch (error) {
    console.error('获取系统CPU统计数据时出错:', error);
    return 0;
  }
}

/**
 * 获取系统空闲CPU统计数据
 * @returns {Promise<number>} - 系统空闲CPU时间
 */
async function getIdleCpuStat() {
  try {
    const cmd = 'cat /proc/stat | grep ^cpu ';
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      console.warn('无法获取系统CPU统计信息');
      return 0;
    }
    
    // 解析系统CPU空闲时间
    // /proc/stat中cpu行格式：cpu user nice system idle iowait irq softirq steal guest guest_nice
    // idle时间在第5列 (index 4)
    const tokens = result.trim().split(/\s+/);
    if (tokens.length < 5) {
      console.warn(`系统CPU统计输出格式异常: ${result}`);
      return 0;
    }
    
    // idle time is the 4th value
    return parseFloat(tokens[4]);
  } catch (error) {
    console.error('获取空闲CPU统计数据时出错:', error);
    return 0;
  }
}


/**
 * 重置CPU采集器状态
 */
export function resetCpuCollector() {
  console.log('重置CPU采集器状态');
  previousCpuStats = {
    processCpuTime: 0,
    totalCpuTime: 0,
    idleCpuTime: 0,
    timestamp: 0,
  };
}


/**
 * 采集CPU使用率
 * @param {string} pid - 进程ID
 * @returns {Promise<{appCpu: number, systemCpu: number}>} - CPU使用率数据
 */
export async function collectCpuUsage(pid) {
  try {
    if (!pid) {
      console.warn('未提供有效的进程ID');
      return { appCpu: 0, systemCpu: 0 };
    }

    // 同时获取当前的所有CPU统计数据
    const [processCpuTime, totalCpuTime, idleCpuTime] = await Promise.all([
      getProcessCpuStat(pid),
      getTotalCpuStat(),
      getIdleCpuStat()
    ]);
    
    const now = Date.now();

    // 如果是首次采集，仅记录数据，不计算
    if (previousCpuStats.timestamp === 0) {
      previousCpuStats = { processCpuTime, totalCpuTime, idleCpuTime, timestamp: now };
      return { appCpu: 0, systemCpu: 0 };
    }

    // 计算时间差
    const processCpuTimeDiff = processCpuTime - previousCpuStats.processCpuTime;
    const totalCpuTimeDiff = totalCpuTime - previousCpuStats.totalCpuTime;
    const idleCpuTimeDiff = idleCpuTime - previousCpuStats.idleCpuTime;
    
    // 更新上一次的统计数据
    previousCpuStats = { processCpuTime, totalCpuTime, idleCpuTime, timestamp: now };

    // 避免除以零
    if (totalCpuTimeDiff <= 0) {
      // console.warn('CPU时间差异为零或负数，无法计算使用率');
      return { appCpu: 0, systemCpu: 0 };
    }
    
    // 计算应用CPU使用率
    const appCpuUsage = (processCpuTimeDiff / totalCpuTimeDiff) * 100;
    
    // 计算系统CPU使用率 ( (总CPU时间 - 空闲CPU时间) / 总CPU时间 )
    const systemCpuUsage = ((totalCpuTimeDiff - idleCpuTimeDiff) / totalCpuTimeDiff) * 100;
    
    // 四舍五入到两位小数
    const appCpu = Math.max(0, Math.min(100, parseFloat(appCpuUsage.toFixed(2))));
    const systemCpu = Math.max(0, Math.min(100, parseFloat(systemCpuUsage.toFixed(2))));

    return { appCpu, systemCpu };
  } catch (error) {
    console.error('采集CPU使用率时出错:', error);
    return { appCpu: 0, systemCpu: 0 };
  }
}

/**
 * 测试CPU采集器
 * @param {string} pid - 进程ID
 */
export async function testCpuCollector(pid) {
  console.log(`开始测试CPU采集器，进程ID: ${pid}`);
  
  try {
    const cpuData = await collectCpuUsage(pid);
    console.log('CPU使用率:', cpuData);
    return cpuData;
  } catch (error) {
    console.error('测试CPU采集器时出错:', error);
    return { appCpu: 0, systemCpu: 0 };
  }
} 