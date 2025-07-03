/**
 * 内存占用采集器
 * 通过执行dumpsys meminfo命令获取应用的内存占用情况
 */

import { executeCommand } from '../../adbManager';

/**
 * 采集内存占用数据
 * @param {string} pid - 进程ID
 * @returns {Promise<{totalPss: number}>} - 内存占用数据，单位MB
 */
export async function collectMemoryUsage(pid) {
  try {
    if (!pid) {
      console.warn('未提供有效的进程ID');
      return { totalPss: 0 };
    }

    const cmd = `dumpsys meminfo ${pid}`;
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      console.warn(`无法获取进程 ${pid} 的内存信息`);
      return { totalPss: 0 };
    }

    // 使用正则表达式提取TOTAL PSS值
    const match = result.match(/TOTAL\s+(\d+)/);
    if (!match || match.length < 2) {
      console.warn(`无法从输出中解析TOTAL PSS: ${result}`);
      return { totalPss: 0 };
    }

    // 将KB转换为MB并保留两位小数
    const totalPssKb = parseInt(match[1], 10);
    const totalPssMb = Math.round((totalPssKb / 1024) * 100) / 100;

    return { totalPss: totalPssMb };
  } catch (error) {
    console.error('采集内存占用数据时出错:', error);
    return { totalPss: 0 };
  }
}

/**
 * 采集详细内存占用数据
 * @param {string} pid - 进程ID
 * @returns {Promise<Object>} - 详细内存占用数据，单位MB
 */
export async function collectDetailedMemoryUsage(pid) {
  try {
    if (!pid) {
      console.warn('未提供有效的进程ID');
      return {
        javaHeap: 0,
        nativeHeap: 0,
        code: 0,
        stack: 0,
        graphics: 0,
        privateOther: 0,
        system: 0
      };
    }

    const cmd = `dumpsys meminfo ${pid}`;
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      console.warn(`无法获取进程 ${pid} 的内存信息`);
      return {
        javaHeap: 0,
        nativeHeap: 0,
        code: 0,
        stack: 0,
        graphics: 0,
        privateOther: 0,
        system: 0
      };
    }

    // 使用正则表达式提取各种内存数据
    const javaHeapMatch = result.match(/Java Heap:\s*(\d+)/);
    const nativeHeapMatch = result.match(/Native Heap:\s*(\d+)/);
    const codeMatch = result.match(/Code:\s*(\d+)/);
    const stackMatch = result.match(/Stack:\s*(\d+)/);
    const graphicsMatch = result.match(/Graphics:\s*(\d+)/);
    const privateOtherMatch = result.match(/Private Other:\s*(\d+)/);
    const systemMatch = result.match(/System:\s*(\d+)/);

    // 转换KB到MB并保留两位小数
    const convertToMB = (match) => {
      if (!match || match.length < 2) return 0;
      const kb = parseInt(match[1], 10);
      return Math.round((kb / 1024) * 100) / 100;
    };

    return {
      javaHeap: convertToMB(javaHeapMatch),
      nativeHeap: convertToMB(nativeHeapMatch),
      code: convertToMB(codeMatch),
      stack: convertToMB(stackMatch),
      graphics: convertToMB(graphicsMatch),
      privateOther: convertToMB(privateOtherMatch),
      system: convertToMB(systemMatch)
    };
  } catch (error) {
    console.error('采集详细内存占用数据时出错:', error);
    return {
      javaHeap: 0,
      nativeHeap: 0,
      code: 0,
      stack: 0,
      graphics: 0,
      privateOther: 0,
      system: 0
    };
  }
}

/**
 * 测试内存占用采集器
 * @param {string} pid - 进程ID
 */
export async function testMemoryCollector(pid) {
  console.log(`开始测试内存占用采集器，进程ID: ${pid}`);
  
  try {
    const memoryData = await collectMemoryUsage(pid);
    console.log('内存占用 (MB):', memoryData);

    const detailedMemoryData = await collectDetailedMemoryUsage(pid);
    console.log('详细内存占用 (MB):', detailedMemoryData);
    
    return { basic: memoryData, detailed: detailedMemoryData };
  } catch (error) {
    console.error('测试内存占用采集器时出错:', error);
    return { 
      basic: { totalPss: 0 },
      detailed: {
        javaHeap: 0,
        nativeHeap: 0,
        code: 0,
        stack: 0,
        graphics: 0,
        privateOther: 0,
        system: 0
      }
    };
  }
} 