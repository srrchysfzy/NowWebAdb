/**
 * CPU使用率采集器
 * 参考solox的逻辑，通过读取/proc/stat和/proc/<pid>/stat文件计算CPU使用率
 */

import { executeCommand } from '../../adbManager';

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
    const processCpuTime = parseFloat(tokens[13]) + parseFloat(tokens[14]) + 
                          parseFloat(tokens[15]) + parseFloat(tokens[16]);
    return processCpuTime;
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
    
    return parseFloat(tokens[4]); // idle time
  } catch (error) {
    console.error('获取系统空闲CPU统计数据时出错:', error);
    return 0;
  }
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

    // 第一次采样
    const processCpuTime1 = await getProcessCpuStat(pid);
    const totalCpuTime1 = await getTotalCpuStat();
    const idleCpuTime1 = await getIdleCpuStat();

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 第二次采样
    const processCpuTime2 = await getProcessCpuStat(pid);
    const totalCpuTime2 = await getTotalCpuStat();
    const idleCpuTime2 = await getIdleCpuStat();

    // 计算时间差
    const processCpuTimeDiff = processCpuTime2 - processCpuTime1;
    const totalCpuTimeDiff = totalCpuTime2 - totalCpuTime1;

    // 避免除以零
    if (totalCpuTimeDiff <= 0) {
      console.warn('CPU时间差异为零，无法计算使用率');
      return { appCpu: 0, systemCpu: 0 };
    }
    
    // 计算应用CPU使用率
    const appCpuUsage = (processCpuTimeDiff / totalCpuTimeDiff) * 100;
    
    // 计算系统CPU使用率
    const totalActiveTime1 = totalCpuTime1 - idleCpuTime1;
    const totalActiveTime2 = totalCpuTime2 - idleCpuTime2;
    const systemCpuUsage = ((totalActiveTime2 - totalActiveTime1) / totalCpuTimeDiff) * 100;
    
    // 四舍五入到两位小数
    const appCpu = Math.round(appCpuUsage * 100) / 100;
    const systemCpu = Math.round(systemCpuUsage * 100) / 100;

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