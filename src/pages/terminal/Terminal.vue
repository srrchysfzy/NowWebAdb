<template>
  <div class="terminal-page">
    <!-- 终端内容区域 -->
    <div class="terminal-content">
      <div v-if="!isDeviceConnected" class="no-device">
        <el-empty description="设备未连接">
          <el-button type="primary" @click="checkDevice">检查设备连接</el-button>
        </el-empty>
      </div>
      <div 
        v-else 
        ref="terminalContainer" 
        class="terminal-container"
        @contextmenu="handleContextMenu"
      ></div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-show="contextMenuVisible" 
      ref="contextMenuRef"
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="context-menu-item" @click="handleContextMenuCommand('restart')">
        <el-icon><Refresh /></el-icon>
        <span>重新启动终端</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuCommand('clear')">
        <el-icon><Delete /></el-icon>
        <span>清除终端内容</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleContextMenuCommand('copy')">
        <el-icon><CopyDocument /></el-icon>
        <span>复制选中内容</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuCommand('paste')">
        <el-icon><DocumentCopy /></el-icon>
        <span>粘贴</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleContextMenuCommand('selectAll')">
        <el-icon><Select /></el-icon>
        <span>全选</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuCommand('fontSize')">
        <el-icon><ZoomIn /></el-icon>
        <span>调整字体大小</span>
      </div>
    </div>

    <!-- 字体大小调整对话框 -->
    <el-dialog v-model="fontSizeDialogVisible" title="调整字体大小" width="300px">
      <div class="font-size-control">
        <el-slider
          v-model="fontSize"
          :min="8"
          :max="24"
          :step="1"
          show-input
          @change="updateFontSize"
        />
        <div class="font-size-preview">
          <span :style="{ fontSize: fontSize + 'px' }">
            预览文本 Preview Text
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="fontSizeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyFontSize">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { 
  Monitor, 
  Refresh, 
  Delete, 
  CopyDocument, 
  DocumentCopy, 
  Select, 
  ZoomIn 
} from '@element-plus/icons-vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { encodeUtf8 } from '@yume-chan/adb'
import { TextDecoderStream, WritableStream } from '@yume-chan/stream-extra'
import { getAdbInstance } from '@/utils/adbManager.js'

// 响应式数据
const terminalContainer = ref(null)
const isConnecting = ref(false)
const isDeviceConnected = ref(false)

// 右键菜单相关
const contextMenuRef = ref(null)
const contextMenuVisible = ref(false)
const contextMenuStyle = ref({})
const fontSizeDialogVisible = ref(false)
const fontSize = ref(14)

// 终端相关变量
let terminal = null
let fitAddon = null
let shellProcess = null
let writer = null

// 生命周期钩子
onMounted(async () => {
  try {
    await checkDevice()
    if (isDeviceConnected.value) {
      await startTerminal()
    }
  } catch (error) {
    console.error('初始化终端时出错:', error)
    ElMessage.error('终端初始化失败')
  }
})

onUnmounted(() => {
  cleanup()
})

onBeforeRouteLeave(async () => {
  await cleanup()
})

// 检查设备连接状态
const checkDevice = async () => {
  const adbInstance = getAdbInstance()
  console.log('检查设备连接状态:', adbInstance)
  isDeviceConnected.value = !!(adbInstance)
  
  if (!isDeviceConnected.value) {
    ElMessage.warning('请先连接设备')
  } else {
    console.log('设备已连接，ADB实例:', adbInstance)
  }
  
  return isDeviceConnected.value
}

// 启动终端
const startTerminal = async () => {
  if (isConnecting.value) return
  isConnecting.value = true

  await cleanup() // 先清理旧实例

  try {
    const adb = await getAdbInstance()
    if (!adb) {
      isDeviceConnected.value = false
      ElMessage.error('无法获取ADB实例，请确保设备已连接')
      return
    }
    isDeviceConnected.value = true

    terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: 'Roboto Mono, Consolas, monospace',
      fontSize: fontSize.value,
      lineHeight: 1.2,
      allowTransparency: true,
      theme: {
        background: '#2c3e50',
        foreground: '#ecf0f1',
        cursor: '#e74c3c',
        black: '#2c3e50',
        red: '#e74c3c',
        green: '#2ecc71',
        yellow: '#f1c40f',
        blue: '#3498db',
        magenta: '#9b59b6',
        cyan: '#1abc9c',
        white: '#ecf0f1',
        brightBlack: '#34495e',
        brightRed: '#c0392b',
        brightGreen: '#27ae60',
        brightYellow: '#f39c12',
        brightBlue: '#2980b9',
        brightMagenta: '#8e44ad',
        brightCyan: '#16a085',
        brightWhite: '#bdc3c7'
      }
    });

    fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(terminalContainer.value)
    fitAddon.fit()

    // 根据支持情况选择协议
    if (adb.subprocess.shellProtocol?.isSupported) {
      // PTY 模式
      shellProcess = await adb.subprocess.shellProtocol.pty({
        terminalType: 'xterm-256color',
        cols: terminal.cols,
        rows: terminal.rows,
      });

      shellProcess.output
        .pipeThrough(new TextDecoderStream())
        .pipeTo(new WritableStream({
          write(chunk) { if (terminal) terminal.write(chunk) }
        }))
        .catch(e => console.error("PTY Shell streams failed", e));
      
      writer = shellProcess.input.getWriter();

      terminal.onResize(({ cols, rows }) => {
        if (shellProcess?.resize) {
           shellProcess.resize(rows, cols);
        }
      });
    } else {
      // 普通模式 (无 PTY)
      shellProcess = await adb.subprocess.noneProtocol.spawn('sh', ['-i']);
      
      const termWriter = new WritableStream({
        write(chunk) { if (terminal) terminal.write(chunk) }
      });

      const p1 = shellProcess.stdout.pipeThrough(new TextDecoderStream()).pipeTo(termWriter, { preventClose: true });
      const p2 = shellProcess.stderr.pipeThrough(new TextDecoderStream()).pipeTo(termWriter, { preventClose: true });
      Promise.all([p1, p2]).catch(e => {
        if (!shellProcess) return; // Already cleaned up
        console.error("Non-PTY Shell streams failed", e);
      });
      
      writer = shellProcess.stdin.getWriter();
    }
    
    terminal.onData(async (data) => {
      if (writer) {
        try {
          await writer.write(encodeUtf8(data));
        } catch (e) {
          console.error('写入终端数据失败:', e);
          await cleanup();
        }
      }
    });

    window.addEventListener('resize', handleResize);
    
  } catch (error) {
    console.error('启动终端时出错:', error);
    ElMessage.error(`启动终端失败: ${error.message}`);
    await cleanup();
  } finally {
    isConnecting.value = false;
  }
}

// 清除终端内容
const clearTerminal = () => {
  if (terminal) {
    terminal.clear()
    ElMessage.success('终端已清除')
  } else {
    ElMessage.warning('终端未启动')
  }
}

// 处理右键菜单
const handleContextMenu = (event) => {
  event.preventDefault()
  
  // 设置菜单位置
  contextMenuStyle.value = {
    position: 'fixed',
    left: event.clientX + 'px',
    top: event.clientY + 'px',
    zIndex: 9999
  }
  
  contextMenuVisible.value = true
  
  // 点击其他地方关闭菜单
  nextTick(() => {
    document.addEventListener('click', hideContextMenu, { once: true })
  })
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenuVisible.value = false
}

// 处理右键菜单命令
const handleContextMenuCommand = (command) => {
  // 隐藏菜单
  contextMenuVisible.value = false
  
  switch (command) {
    case 'restart':
      startTerminal()
      break
    case 'clear':
      clearTerminal()
      break
    case 'copy':
      copySelectedText()
      break
    case 'paste':
      pasteText()
      break
    case 'selectAll':
      selectAllText()
      break
    case 'fontSize':
      fontSizeDialogVisible.value = true
      break
  }
}

// 复制选中文本
const copySelectedText = () => {
  if (terminal && terminal.hasSelection()) {
    const selectedText = terminal.getSelection()
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).then(() => {
        ElMessage.success('已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
    }
  } else {
    ElMessage.warning('请先选择要复制的文本')
  }
}

// 粘贴文本
const pasteText = async () => {
  if (!terminal || !writer) {
    ElMessage.warning('终端未启动')
    return
  }
  
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      const buffer = encodeUtf8(text)
      await writer.write(buffer)
      ElMessage.success('已粘贴文本')
    }
  } catch (error) {
    ElMessage.error('粘贴失败，请检查剪贴板权限')
  }
}

// 全选文本
const selectAllText = () => {
  if (terminal) {
    terminal.selectAll()
    ElMessage.success('已全选文本')
  } else {
    ElMessage.warning('终端未启动')
  }
}

// 更新字体大小
const updateFontSize = (size) => {
  fontSize.value = size
}

// 应用字体大小
const applyFontSize = () => {
  if (terminal) {
    terminal.options.fontSize = fontSize.value
    if (fitAddon) {
      fitAddon.fit()
    }
    ElMessage.success('字体大小已更新')
  }
  fontSizeDialogVisible.value = false
}

// 处理窗口大小变化
const handleResize = () => {
  if (fitAddon && terminal) {
    setTimeout(() => {
      fitAddon.fit()
      // 如果是 PTY 模式，同步大小
      if (shellProcess && shellProcess.resize) {
        shellProcess.resize(terminal.rows, terminal.cols).catch((error) => {
          console.warn('调整PTY大小失败:', error)
        })
      }
    }, 100)
  }
}

// 清理资源
const cleanup = async () => {
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', hideContextMenu)
  
  // 隐藏右键菜单
  contextMenuVisible.value = false
  
  const p = shellProcess
  shellProcess = null // Prevent re-entry

  const w = writer
  writer = null

  // 优雅地终止进程
  if (p) {
    if (w) {
      // 关闭输入流会通知 shell 退出
      await w.close().catch(() => { /* ignore error if already closed */ })
    }
    // 等待进程真正退出
    if (p.result) {
      await p.result.catch(() => { /* ignore error on exit */ })
    }
  }
  
  // 销毁终端
  if (terminal) {
    terminal.dispose()
    terminal = null
  }
  
  fitAddon = null
}
</script>

<style scoped>
.terminal-page {
  padding: 20px;
  height: 93vh;
  display: flex;
  flex-direction: column;
}

.terminal-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  font-size: 14px;
}

.terminal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.no-device {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.terminal-container {
  flex: 1;
  border-radius: 8px;
  background-color: #2c3e50;
  color: #ecf0f1;
  min-height: 400px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.terminal-container:hover {
  border-color: #409eff;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 深色主题适配 */
.dark .terminal-container {
  border-color: #4c4d4f;
  background-color: #1e1e1e;
}

.dark .header-title {
  color: #e5eaf3;
}

/* Custom scrollbar for terminal - Force override */
.terminal-container :deep(.xterm .xterm-viewport) {
  /* For Webkit browsers (Chrome, Safari) */
  scrollbar-width: auto !important;
  scrollbar-color: #888 #2c3e50 !important;
}

.terminal-container :deep(.xterm .xterm-viewport::-webkit-scrollbar) {
  width: 14px !important;
}

.terminal-container :deep(.xterm .xterm-viewport::-webkit-scrollbar-track) {
  background: #2c3e50 !important;
}

.terminal-container :deep(.xterm .xterm-viewport::-webkit-scrollbar-thumb) {
  background-color: #555 !important;
  border-radius: 6px !important;
  border: 3px solid #2c3e50 !important;
  cursor: pointer !important;
}

.terminal-container :deep(.xterm .xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background-color: #888 !important;
}

/* 右键菜单样式 */
.context-menu {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 6px 0;
  min-width: 160px;
  font-size: 14px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

.context-menu-item .el-icon {
  font-size: 16px;
  color: #606266;
}

.context-menu-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 6px 0;
}

/* 字体大小调整对话框样式 */
.font-size-control {
  padding: 20px 0;
}

.font-size-preview {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .terminal-page {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .terminal-container {
    min-height: 300px;
  }
}
</style> 