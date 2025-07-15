/**
 * 前台应用采集器
 * 获取当前前台运行的应用程序信息
 */

import { executeCommand } from '../../adbManager';

/**
 * 获取应用的显示名称（兼容版本）
 * @param {string} packageName - 应用包名
 * @returns {Promise<string>} - 应用显示名称
 */
async function getAppDisplayName(packageName) {
  try {
    if (!packageName) return packageName;

    // 移除timeout命令，提高兼容性
    const cmd = `dumpsys package ${packageName} | grep -m 1 "label" | head -1`;
    const result = await executeCommand(cmd);

    if (result && result.trim()) {
      const match = result.match(/label=([^,\s]+)/);
      if (match && match[1] && match[1] !== packageName) {
        return match[1];
      }
    }

    return packageName;
  } catch (error) {
    return packageName;
  }
}

/**
 * 获取应用的进程ID（兼容版本）
 * @param {string} packageName - 应用包名
 * @returns {Promise<string|null>} - 进程ID
 */
async function getAppPid(packageName) {
  try {
    if (!packageName) return null;

    // 移除timeout命令，提高兼容性
    const cmd = `ps -A | grep -m 1 ${packageName} | grep -v grep | head -1`;
    const result = await executeCommand(cmd);

    if (result && result.trim()) {
      const parts = result.trim().split(/\s+/);
      if (parts.length >= 2) {
        return parts[1]; // PID通常是第二列
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 通过焦点窗口获取前台应用信息
 * @returns {Promise<Object|null>} - 前台应用信息
 */
async function getForegroundAppByFocus() {
  try {
    const cmd = 'dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp" | head -3';
    const result = await executeCommand(cmd);

    if (!result || result.trim() === '') {
      return null;
    }

    // 使用最有效的匹配模式
    const patterns = [
      /mCurrentFocus.*?{.*?\s+([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /mFocusedApp.*?{.*?\s+([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /mCurrentFocus.*?{.*?\s+([a-zA-Z0-9._]+)\s/
    ];

    for (const pattern of patterns) {
      const match = result.match(pattern);
      if (match && match[1]) {
        const packageName = match[1];
        const activityName = match[2] || '';

        // 基本过滤
        if (packageName !== 'null' &&
            !packageName.includes('StatusBar') &&
            packageName.includes('.') &&
            packageName.length > 3) {
          return {
            packageName,
            activityName: activityName ? `${packageName}/${activityName}` : packageName,
            source: 'focus'
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 通过Activity信息获取前台应用信息
 * @returns {Promise<Object|null>} - 前台应用信息
 */
async function getForegroundAppByActivity() {
  try {
    const cmd = 'dumpsys activity activities | grep -E "mResumedActivity|ResumedActivity" | head -3';
    const result = await executeCommand(cmd);

    if (!result || result.trim() === '') {
      return null;
    }

    // 使用最有效的匹配模式
    const patterns = [
      /mResumedActivity.*?{.*?\s+([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /ResumedActivity.*?{.*?\s+([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /RESUMED.*?([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /ActivityRecord{.*?\s+([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/
    ];

    for (const pattern of patterns) {
      const match = result.match(pattern);
      if (match && match.length >= 3) {
        const packageName = match[1];
        const activityName = match[2];

        // 基本验证包名格式
        if (packageName.includes('.') && packageName.length > 3) {
          return {
            packageName,
            activityName: `${packageName}/${activityName}`,
            source: 'activity'
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 通过Top Activity获取前台应用信息
 * @returns {Promise<Object|null>} - 前台应用信息
 */
async function getForegroundAppByTop() {
  try {
    const cmd = 'dumpsys activity top | head -30';
    const result = await executeCommand(cmd);

    if (!result || result.trim() === '') {
      return null;
    }

    // 使用最有效的匹配模式
    const patterns = [
      /ACTIVITY.*?([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /ActivityRecord{.*?\s+([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+)/,
      /([a-zA-Z0-9._]+)\/([a-zA-Z0-9._$]+).*?state=RESUMED/i
    ];

    for (const pattern of patterns) {
      const match = result.match(pattern);
      if (match && match.length >= 3) {
        const packageName = match[1];
        const activityName = match[2];

        // 基本验证包名格式
        if (packageName.includes('.') && packageName.length > 3) {
          return {
            packageName,
            activityName: `${packageName}/${activityName}`,
            source: 'top'
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}



/**
 * 前台应用信息采集（优化版本）
 * @returns {Promise<Object>} - 前台应用信息
 */
export async function collectForegroundApp() {
  try {
    // 使用3种最可靠的检测方法
    const methods = [
      getForegroundAppByActivity,  // 最可靠
      getForegroundAppByTop,       // 次可靠
      getForegroundAppByFocus      // 备用
    ];

    let foregroundApp = null;

    // 顺序执行，找到第一个有效结果立即返回
    for (const method of methods) {
      try {
        const result = await Promise.race([
          method(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);

        if (result && result.packageName) {
          foregroundApp = result;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!foregroundApp || !foregroundApp.packageName) {
      return {
        packageName: null,
        activityName: null,
        appName: null,
        pid: null,
        source: null,
        isSystemApp: false
      };
    }

    // 判断是否为系统应用
    const isSystemApp = foregroundApp.packageName.startsWith('com.android.') ||
                       foregroundApp.packageName.startsWith('com.google.') ||
                       foregroundApp.packageName.startsWith('com.samsung.') ||
                       foregroundApp.packageName.startsWith('com.miui.') ||
                       foregroundApp.packageName.startsWith('com.xiaomi.');

    // 并行获取额外信息
    const getAppInfoWithTimeout = (promise, timeout = 1500) =>
      Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve(null), timeout))
      ]);

    const [appName, pid] = await Promise.all([
      getAppInfoWithTimeout(getAppDisplayName(foregroundApp.packageName)),
      getAppInfoWithTimeout(getAppPid(foregroundApp.packageName))
    ]);

    return {
      packageName: foregroundApp.packageName,
      activityName: foregroundApp.activityName,
      appName: appName || foregroundApp.packageName,
      pid: pid,
      source: foregroundApp.source,
      isSystemApp: isSystemApp
    };

  } catch (error) {
    return {
      packageName: null,
      activityName: null,
      appName: null,
      pid: null,
      source: null,
      isSystemApp: false
    };
  }
}

/**
 * 重置前台应用采集器
 */
export function resetForegroundAppCollector() {
  // 前台应用采集器无需重置状态
}
