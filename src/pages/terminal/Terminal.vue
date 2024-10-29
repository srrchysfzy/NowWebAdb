<template>
  <div ref="terminalRef" :style="{width: width-39 + 'px',height : height-100 + 'px'}" />
</template>
<script setup>
import { encodeUtf8 } from "@yume-chan/adb";
import { Consumable } from "@yume-chan/stream-extra";
import { getAdbInstance } from "@/utils/adbManager.js";
import useWindowResize from "@/utils/useWindowResize.js";
import { debounce } from 'lodash'
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

let term = ref({})
const terminalRef = ref(null)
const fitAddon = new FitAddon();
const { width, height } = useWindowResize()
const adbObject = computed(() => {
  return getAdbInstance()
});
const initTr = async () => {
  term.value = new Terminal({
    // lineHeight: 1.2,
    fontSize: 14,
    fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
    theme: {
      background: '#181d28',
    },
    // 光标闪烁
    cursorBlink: true,
    cursorStyle: 'underline',
    // scrollback: 100,
    // tabStopWidth: 4,
  });
  term.value.open(terminalRef.value);
  term.value.loadAddon(fitAddon);
  // 不能初始化的时候fit,需要等terminal准备就绪,可以设置延时操作
  setTimeout(() => {
    fitAddon.fit();
  }, 5)
  const process = await adbObject.value.subprocess.shell();
  await termData(process)
  await process.stdout.pipeTo(
    new WritableStream({
      write(chunk) {
        term.value.write(chunk);
      },
    }),
  );
}
const termData = async (process) => {
  const writer = process.stdin.getWriter();
  term.value.onData((data) => {
    const buffer = encodeUtf8(data);
    const consumable = new Consumable(buffer);
    writer.write(consumable);
  });
}
// 适应浏览器尺寸变化
const fitTerm = () => {
  fitAddon.fit()
}
const onResize = debounce(() => fitTerm(), 500)
const onTerminalResize = () => {
  window.addEventListener('resize', onResize)
}
const removeResizeListener = () => {
  window.removeEventListener('resize', onResize)
}
onMounted(async () => {
  await initTr()
  onTerminalResize()
})
onBeforeUnmount(() => {
  removeResizeListener()
})
</script>
<style lang="scss" scoped>
</style>