let adbInstance

export function setAdbInstance(instance) {
    adbInstance = instance;
}

export function getAdbInstance() {
    return adbInstance;
}

// 执行shell命令
export async function executeCommand(command) {
    if (!adbInstance) {
        return '';
    }
    try {
        // 优先使用 shell protocol，如果不支持则使用 none protocol
        if (adbInstance.subprocess.shellProtocol?.isSupported) {
            const result = await adbInstance.subprocess.shellProtocol.spawnWaitText(command);
            return result.stdout;
        } else {
            // 使用 none protocol 作为备选
            const process = await adbInstance.subprocess.noneProtocol.spawn(command);
            const reader = process.stdout.getReader();
            const chunks = [];
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(decoder.decode(value, { stream: true }));
            }
            return chunks.join('');
        }
    } catch (error) {
        console.error('执行命令出错:', error);
        return '';
    }
}

/**
 * 获取已安装的应用列表
 * @param {boolean} includeSystem - 是否包含系统应用
 * @returns {Promise<Array<{packageName: string, appName: string}>>} - 应用列表
 */
export async function getInstalledApps(includeSystem = false) {
    try {
        // 使用pm命令获取已安装应用列表
        const command = includeSystem 
            ? 'pm list packages -f' 
            : 'pm list packages -3 -f'; // -3表示第三方应用，-f表示包含APK路径
        
        const result = await executeCommand(command);
        if (!result) {
            console.warn('获取应用列表失败');
            return [];
        }
        
        const lines = result.trim().split('\n');
        const apps = [];
        
        for (const line of lines) {
            // 格式: package:/data/app/com.example.app-hash/base.apk=com.example.app
            const match = line.match(/package:(.+)=(.+)/);
            if (match && match.length >= 3) {
                const apkPath = match[1];
                const packageName = match[2];
                
                // 获取应用名称
                const appNameResult = await executeCommand(`dumpsys package ${packageName} | grep "versionName"`);
                let appName = packageName; // 默认使用包名作为应用名
                
                // 尝试从应用信息中提取更友好的名称
                if (appNameResult) {
                    const labelMatch = await executeCommand(`aapt dump badging ${apkPath} | grep "application-label:"`);
                    if (labelMatch) {
                        const labelResult = labelMatch.match(/application-label:'(.+)'/);
                        if (labelResult && labelResult.length >= 2) {
                            appName = labelResult[1];
                        }
                    }
                }
                
                apps.push({
                    packageName,
                    appName
                });
            }
        }
        
        return apps;
    } catch (error) {
        console.error('获取已安装应用列表时出错:', error);
        return [];
    }
}

// 计算文件大小
export function formatSize(size) {
    if (size < 1024) {
        return size + 'B'
    } else if (size < 1024 * 1024) {
        return (Number(size) / 1024).toFixed(2) + 'KB'
    } else if (size < 1024 * 1024 * 1024) {
        return (Number(size) / 1024 / 1024).toFixed(2) + 'MB'
    } else {
        return (Number(size) / 1024 / 1024 / 1024).toFixed(2) + 'GB'
    }
}

/**
 * 获取应用的进程列表
 * @param {string} packageName - 应用包名
 * @returns {Promise<Array<{pid: string, name: string}>>} - 进程列表
 */
export async function getProcessList(packageName) {
    try {
        if (!packageName) {
            console.warn('获取进程列表失败: 包名为空');
            return [];
        }

        // 获取设备Android版本
        const sdkVersionCmd = `getprop ro.build.version.sdk`;
        const sdkVersionResult = await executeCommand(sdkVersionCmd);
        const sdkVersion = parseInt(sdkVersionResult.trim(), 10);

        // 根据Android版本选择不同的命令
        let result;
        if (sdkVersion < 26) {
            // Android 8.0以下
            result = await executeCommand(`ps | grep ${packageName}`);
        } else {
            // Android 8.0及以上
            result = await executeCommand(`ps -ef | grep ${packageName}`);
        }

        if (!result) {
            console.warn(`未找到应用 ${packageName} 的进程`);
            return [];
        }

        const processList = [];
        const lines = result.trim().split('\n');

        for (const line of lines) {
            // 跳过grep进程本身
            if (line.includes('grep')) {
                continue;
            }

            const parts = line.trim().split(/\s+/);
            if (parts.length < 8) continue; // 确保有足够的列
            
            let pid, processName;
            
            if (sdkVersion < 26) {
                // Android 8.0以下 ps 输出格式: USER PID PPID ... NAME
                pid = parts[1];
                processName = parts[parts.length - 1];
            } else {
                // Android 8.0及以上 ps -ef 输出格式: UID PID PPID ... NAME
                pid = parts[1];
                processName = parts[parts.length - 1];
            }
            
            // 确保找到的进程包含包名
            if (processName.includes(packageName)) {
                processList.push({
                    pid,
                    name: processName
                });
            }
        }
        
        // 排序，主进程排在前面
        processList.sort((a, b) => {
            // 如果进程名完全匹配包名，则排在前面
            if (a.name === packageName) return -1;
            if (b.name === packageName) return 1;
            return 0;
        });

        return processList;
    } catch (error) {
        console.error('获取进程列表时出错:', error);
        return [];
    }
}