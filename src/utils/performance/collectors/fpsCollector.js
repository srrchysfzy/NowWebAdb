/**
 * FPS采集器
 * 通过分析SurfaceFlinger数据获取应用的界面帧率
 */

import { executeCommand } from '../../adbManager';

// 纳秒到秒的转换常量
const NANOSECONDS_PER_SECOND = 1e9;

// 挂起的围栏时间戳，用于过滤未完成的帧
const PENDING_FENCE_TIMESTAMP = (1n << 63n) - 1n;

// 卡顿阈值（毫秒）
const JANK_THRESHOLD_MS = 166; // 约为16.6ms（60FPS）的10倍

// 存储上一次采集的帧数据，用于计算帧率变化
let previousFrameData = {
  totalFrames: 0,
  jankFrames: 0,
  timestamp: 0,
  frameTimestamps: [], // 存储前几帧的时间戳，用于计算卡顿
  lastTimestamp: 0,
  isFirst: true
};

/**
 * 获取当前焦点窗口
 * @param {string} packageName - 应用包名
 * @returns {Promise<string>} - 焦点窗口名称
 */
async function getFocusWindow(packageName) {
  try {
    // 首先尝试获取当前焦点窗口
    const cmd = 'dumpsys window windows | grep -E "mCurrentFocus"';
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      return getSurfaceViewWindow(packageName);
    }
    
    console.log('焦点窗口信息:', result);
    
    // 解析焦点窗口名称
    // 通常格式为: mCurrentFocus=Window{...} <包名>/<活动名>
    const match = result.match(/mCurrentFocus.*?{.*?\s+([^\s\/]+)(?:\/([^\s}]+))?/);
    if (!match || match.length < 2) {
      console.warn(`无法从输出中解析焦点窗口: ${result}`);
      return getSurfaceViewWindow(packageName);
    }
    
    const focusPackageName = match[1];
    const activityName = match[2] || '';
    
    // 检查焦点窗口是否与目标应用匹配
    if (!focusPackageName.includes(packageName)) {
      console.warn(`焦点窗口(${focusPackageName})与目标应用(${packageName})不匹配，尝试使用SurfaceView`);
      return getSurfaceViewWindow(packageName);
    }
    
    console.log(`解析到的包名: ${focusPackageName}, 活动名: ${activityName}`);
    
    // 处理特殊字符
    let windowName = focusPackageName;
    if (activityName) {
      windowName = `${focusPackageName}/${activityName}`;
    }
    
    if (windowName.includes('$')) {
      windowName = windowName.replace(/\$/g, '\\$');
    }
    
    return windowName;
  } catch (error) {
    console.error('获取焦点窗口时出错:', error);
    return getSurfaceViewWindow(packageName);
  }
}

/**
 * 获取应用的SurfaceView窗口
 * @param {string} packageName - 应用包名
 * @returns {Promise<string>} - SurfaceView窗口名称
 */
async function getSurfaceViewWindow(packageName) {
  try {
    // 获取应用的SurfaceView窗口
    const cmd = `dumpsys SurfaceFlinger --list | grep ${packageName}`;
    const result = await executeCommand(cmd);
    
    if (!result || result.trim() === '') {
      console.warn(`无法获取应用 ${packageName} 的SurfaceView窗口`);
      return packageName; // 退回到使用应用包名
    }
    
    const lines = result.trim().split('\n');
    
    // 首先尝试查找SurfaceView
    for (const line of lines) {
      if (line.includes('SurfaceView') && line.includes(packageName)) {
        return line.trim();
      }
    }
    
    // 如果没有找到SurfaceView，使用最后一个匹配的窗口
    if (lines.length > 0) {
      return lines[lines.length - 1].trim();
    }
    
    console.warn('无法找到任何匹配的窗口，退回到使用应用包名');
    return packageName;
  } catch (error) {
    console.error('获取SurfaceView窗口时出错:', error);
    return packageName; // 退回到使用应用包名
  }
}

/**
 * 清除SurfaceFlinger延迟数据
 * @param {string} windowName - 窗口名称
 * @returns {Promise<boolean>}
 */
async function clearSurfaceFlingerLatencyData(windowName) {
  try {
    if (!windowName) return false;
    
    // 执行命令清除延迟数据
    const cmd = windowName ? 
      `dumpsys SurfaceFlinger --latency-clear "${windowName}"` : 
      'dumpsys SurfaceFlinger --latency-clear';
      
    const result = await executeCommand(cmd);
    return !result || result.trim() === '';
  } catch (error) {
    console.error('清除SurfaceFlinger延迟数据时出错:', error);
    return false;
  }
}

/**
 * 获取SurfaceFlinger帧数据
 * @param {string} windowName - 窗口名称
 * @param {boolean} isSurfaceView - 是否使用SurfaceView方式获取
 * @returns {Promise<{refreshPeriod: number, timestamps: Array<Array<number>>}>} - 刷新周期和时间戳数组
 */
async function getSurfaceFlingerFrameData(windowName, isSurfaceView = true) {
  try {
    if (!windowName) {
      return { refreshPeriod: null, timestamps: [] };
    }
    
    let cmd, results;
    const nanoseconds_per_second = 1e9;
    const pending_fence_timestamp = Number((1n << 63n) - 1n);
    let refreshPeriod = null;
    let timestamps = [];
    
    if (!isSurfaceView) {
      // 使用gfxinfo framestats方式获取
      cmd = `dumpsys SurfaceFlinger --latency "${windowName}"`;
      results = await executeCommand(cmd);
      
      if (!results || !results.trim()) {
        return { refreshPeriod: null, timestamps: [] };
      }
      
      const lines = results.replace(/\r\n/g, '\n').split('\n');
      refreshPeriod = parseInt(lines[0], 10) / nanoseconds_per_second;
      
      // 获取帧统计数据
      const packageName = windowName.split('/')[0];
      cmd = `dumpsys gfxinfo ${packageName} framestats`;
      results = await executeCommand(cmd);
      
      if (!results || !results.trim()) {
        return { refreshPeriod, timestamps: [] };
      }
      
      const resultLines = results.replace(/\r\n/g, '\n').split('\n');
      let isHaveFoundWindow = false;
      let PROFILEDATA_line = 0;
      let activity = windowName;
      
      if (activity.includes('#')) {
        activity = activity.split('#')[0];
      }
      
      for (const line of resultLines) {
        if (!isHaveFoundWindow) {
          if (line.includes("Window") && line.includes(activity)) {
            isHaveFoundWindow = true;
          }
          continue;
        }
        
        if (line.includes("PROFILEDATA")) {
          PROFILEDATA_line++;
        }
        
        const fields = line.split(",");
        if (fields.length && fields[0] === '0') {
          // 1=INTENDED_VSYNC, 2=VSYNC, 13=FRAME_COMPLETED
          const timestamp = [
            parseInt(fields[1], 10), 
            parseInt(fields[2], 10), 
            parseInt(fields[13], 10)
          ];
          
          if (timestamp[1] === pending_fence_timestamp) {
            continue;
          }
          
          const timestampInSeconds = timestamp.map(ts => ts / nanoseconds_per_second);
          timestamps.push(timestampInSeconds);
        }
        
        if (PROFILEDATA_line === 2) {
          break;
        }
      }
    } else {
      // 使用SurfaceView方式获取
      cmd = `dumpsys SurfaceFlinger --latency "${windowName}"`;
      results = await executeCommand(cmd);
      
      if (!results || !results.trim()) {
        return { refreshPeriod: null, timestamps: [] };
      }
      
      const lines = results.replace(/\r\n/g, '\n').split('\n');
      
      if (lines.length <= 1 || !lines[0].match(/^\d+$/)) {
        return { refreshPeriod: null, timestamps: [] };
      }
      
      try {
        refreshPeriod = parseInt(lines[0], 10) / nanoseconds_per_second;
      } catch (e) {
        console.error('解析刷新周期出错:', e);
        return { refreshPeriod: null, timestamps: [] };
      }
      
      // 从第三行开始解析时间戳
      for (let i = 2; i < lines.length; i++) {
        const fields = lines[i].trim().split(/\s+/);
        if (fields.length !== 3) continue;
        
        // 解析三个时间戳：应用开始绘制、垂直同步、提交到硬件
        const timestamp = fields.map(field => BigInt(field));
        
        // 过滤掉未完成的帧
        if (timestamp[1] === PENDING_FENCE_TIMESTAMP) continue;
        
        // 转换为秒
        const timestampInSeconds = timestamp.map(ts => Number(ts) / nanoseconds_per_second);
        timestamps.push(timestampInSeconds);
      }
    }
    
    return { refreshPeriod, timestamps };
  } catch (error) {
    console.error('获取SurfaceFlinger帧数据时出错:', error);
    return { refreshPeriod: null, timestamps: [] };
  }
}

/**
 * 计算FPS和卡顿数
 * @param {number} refreshPeriod - 刷新周期（秒）
 * @param {Array<Array<number>>} timestamps - 时间戳数组
 * @returns {{fps: number, jank: number}} - FPS和卡顿数
 */
function calculateResults(refreshPeriod, timestamps) {
  const frame_count = timestamps.length;
  
  if (frame_count === 0) {
    return { fps: 0, jank: 0 };
  } else if (frame_count === 1) {
    return { fps: 1, jank: 0 };
  } else if (frame_count >= 2 && frame_count <= 4) {
    // 计算总时间和FPS
    const seconds = timestamps[timestamps.length - 1][1] - timestamps[0][1];
    if (seconds > 0) {
      const fps = Math.round((frame_count - 1) / seconds);
      const jank = calculateJanky(timestamps);
      return { fps, jank };
    } else {
      return { fps: 1, jank: 0 };
    }
  } else {
    // 计算总时间和FPS
    const seconds = timestamps[timestamps.length - 1][1] - timestamps[0][1];
    if (seconds > 0) {
      const fps = Math.round((frame_count - 1) / seconds);
      const jank = calculateJankyNew(timestamps);
      return { fps, jank };
    } else {
      return { fps: 1, jank: 0 };
    }
  }
}

/**
 * 计算卡顿帧数（简单方法）
 * @param {Array<Array<number>>} timestamps - 时间戳数组
 * @returns {number} - 卡顿帧数
 */
function calculateJanky(timestamps) {
  const jankThreshold = JANK_THRESHOLD_MS / 1000.0;
  let tempstamp = 0;
  let jank = 0;
  
  for (const timestamp of timestamps) {
    if (tempstamp === 0) {
      tempstamp = timestamp[1];
      continue;
    }
    const costtime = timestamp[1] - tempstamp;
    if (costtime > jankThreshold) {
      jank++;
    }
    tempstamp = timestamp[1];
  }
  
  return jank;
}

/**
 * 计算卡顿帧数（改进版）
 * @param {Array<Array<number>>} timestamps - 时间戳数组
 * @returns {number} - 卡顿帧数
 */
function calculateJankyNew(timestamps) {
  const jankThreshold = JANK_THRESHOLD_MS / 1000.0;
  const twofilmstamp = 83.3 / 1000.0;  // 约两帧时间
  let tempstamp = 0;
  let jank = 0;
  
  for (let index = 0; index < timestamps.length; index++) {
    const timestamp = timestamps[index];
    
    if (index <= 3) {
      // 前几帧使用简单方法
      if (tempstamp === 0) {
        tempstamp = timestamp[1];
        continue;
      }
      const costtime = timestamp[1] - tempstamp;
      if (costtime > jankThreshold) {
        jank++;
      }
      tempstamp = timestamp[1];
    } else {
      // 从第5帧开始使用改进算法
      const currentstamp = timestamps[index][1];
      const lastonestamp = timestamps[index - 1][1];
      const lasttwostamp = timestamps[index - 2][1];
      const lastthreestamp = timestamps[index - 3][1];
      const lastfourstamp = timestamps[index - 4][1];
      
      // 计算前三帧的平均帧时间的两倍作为阈值
      const tempframetime = ((lastthreestamp - lastfourstamp) + 
                            (lasttwostamp - lastthreestamp) + 
                            (lastonestamp - lasttwostamp)) / 3 * 2;
      
      // 计算当前帧时间
      const currentframetime = currentstamp - lastonestamp;
      
      // 判断是否为卡顿
      if (currentframetime > tempframetime && currentframetime > twofilmstamp) {
        jank++;
      }
    }
  }
  
  return jank;
}

/**
 * 从gfxinfo输出中解析帧信息
 * @param {string} output - gfxinfo命令的输出
 * @returns {{totalFrames: number, jankFrames: number, fps: number}} - 解析结果
 */
function parseGfxInfo(output) {
  // 默认值
  let totalFrames = 0;
  let jankFrames = 0;
  let fps = 0;
  
  // 查找总帧数
  const totalFramesMatch = output.match(/Total frames rendered:\s*(\d+)/);
  if (totalFramesMatch && totalFramesMatch.length > 1) {
    totalFrames = parseInt(totalFramesMatch[1], 10);
  }
  
  // 查找卡顿帧数
  const jankFramesMatch = output.match(/Janky frames:\s*(\d+)\s*\((\d+\.\d+)%\)/);
  if (jankFramesMatch && jankFramesMatch.length > 1) {
    jankFrames = parseInt(jankFramesMatch[1], 10);
  }
  
  // 不再计算模拟的FPS
  if (totalFrames === 0) {
    return { totalFrames, jankFrames, fps: 0 };
  }
  
  // 从前后两次数据计算实际帧率
  if (previousFrameData.timestamp > 0 && previousFrameData.totalFrames > 0) {
    const frameDiff = totalFrames - previousFrameData.totalFrames;
    const timeDiff = (Date.now() - previousFrameData.timestamp) / 1000;
    
    if (frameDiff > 0 && timeDiff > 0) {
      fps = Math.round(frameDiff / timeDiff);
      // 限制FPS合理范围
      fps = Math.min(120, Math.max(0, fps));
    }
  }
  
  return { totalFrames, jankFrames, fps };
}

/**
 * 采集FPS数据
 * @param {string} packageName - 应用包名
 * @returns {Promise<{fps: number, jank: number}>} - FPS和卡顿数
 */
export async function collectFps(packageName) {
  try {
    if (!packageName) {
      console.warn('未提供有效的应用包名');
      return { fps: 0, jank: 0 };
    }
    
    // 获取焦点窗口
    const windowName = await getFocusWindow(packageName);
    if (!windowName) {
      console.warn(`无法获取应用 ${packageName} 的有效窗口`);
      return { fps: 0, jank: 0 };
    }

    // 首次采集，清除数据
    if (previousFrameData.isFirst) {
      await clearSurfaceFlingerLatencyData(windowName);
      previousFrameData.isFirst = false;
      previousFrameData.lastTimestamp = 0; // 初始时间戳为0
      return { fps: 0, jank: 0 };
    }
    
    // 非首次采集
    const { refreshPeriod, timestamps } = await getSurfaceFlingerFrameData(windowName, true);
    // 采集后立即清除数据，为下一次做准备
    await clearSurfaceFlingerLatencyData(windowName);

    if (!refreshPeriod || !timestamps || timestamps.length < 2) {
      return { fps: 0, jank: 0 };
    }
    
    // 过滤掉旧的帧数据，只保留比上次记录的最新时间戳还新的帧
    let newTimestamps = timestamps;
    if (previousFrameData.lastTimestamp > 0) {
      newTimestamps = timestamps.filter(ts => ts[1] > previousFrameData.lastTimestamp);
    }
    
    if (newTimestamps.length < 2) {
      return { fps: 0, jank: 0 };
    }
    
    // 更新最后的时间戳
    previousFrameData.lastTimestamp = newTimestamps[newTimestamps.length - 1][1];

    // 使用 calculateResults 计算 FPS 和卡顿
    const results = calculateResults(refreshPeriod, newTimestamps);
    
    return { fps: results.fps, jank: results.jank };
  } catch (error) {
    console.error('采集FPS数据时出错:', error);
    return { fps: 0, jank: 0 };
  }
}

/**
 * 重置FPS采集器状态
 */
export function resetFpsCollector() {
  console.log('重置FPS采集器状态');
  previousFrameData = {
    totalFrames: 0,
    jankFrames: 0,
    timestamp: 0,
    frameTimestamps: [],
    lastTimestamp: 0, // lastTimestamp 也应重置
    isFirst: true
  };
}

/**
 * 测试FPS采集器
 * @param {string} packageName - 应用包名
 */
export async function testFpsCollector(packageName) {
  console.log(`开始测试FPS采集器，应用包名: ${packageName}`);
  
  try {
    // 重置采集器状态
    resetFpsCollector();
    
    // 第一次采集
    let fpsData = await collectFps(packageName);
    console.log('初始FPS数据:', fpsData);
    
    // 等待一段时间
    console.log('等待1秒...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 第二次采集
    fpsData = await collectFps(packageName);
    console.log('1秒后FPS数据:', fpsData);
    
    return fpsData;
  } catch (error) {
    console.error('测试FPS采集器时出错:', error);
    return { fps: 0, jank: 0 };
  }
} 