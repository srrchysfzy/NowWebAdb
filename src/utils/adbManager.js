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