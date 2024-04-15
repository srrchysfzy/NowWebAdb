import {AdbSubprocessNoneProtocol} from "@yume-chan/adb";
import {DecodeUtf8Stream} from "@yume-chan/stream-extra";

let adbInstance = null;

export function setAdbInstance(instance) {
    adbInstance = instance;
}

export function getAdbInstance() {
    return adbInstance;
}

// 执行shell命令
export async function executeCommand(command) {
    if (!adbInstance) {
        return;
    }
    try {
        const process = await adbInstance.subprocess.spawn(command, {
            protocols: [AdbSubprocessNoneProtocol],
        });

        const reader = process.stdout.getReader();
        const chunks = [];
        let decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(decoder.decode(value, { stream: true }));
        }

        await process.kill();
        const output = chunks.join('');
        return output;
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