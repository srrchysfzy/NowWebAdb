<template>
  <el-card style="border-radius: 12px">
    <el-space>
        <!-- 用于展示内容的容器 -->
        <div ref="renderContainer"
             :class="classes"
             :style="containerStyle"
             @pointerdown="handlePointerDown"
             @pointermove="handlePointerMove"
             @pointerup="handlePointerUp"
             @pointercancel="handlePointerUp"
             @pointerleave="handlePointerLeave"
             @contextmenu="handleContextMenu"
        />
    </el-space>
    <el-space style="float: right; margin-top: 3px">
      <el-tooltip effect="dark" content="开启键盘">
        <div style="margin-top: 4px">
          <el-button v-if="openInput" type="primary" circle @click="openKeyInput('cancel')">
            <el-icon :size="12" style="vertical-align: middle">
              <EditPen />
            </el-icon>
          </el-button>
          <el-button v-else type="info" circle @click="openKeyInput('open')">
            <el-icon :size="12" style="vertical-align: middle">
              <EditPen />
            </el-icon>
          </el-button>
        </div>
      </el-tooltip>
    </el-space>
  </el-card>
</template>
<script setup>
import { ref, computed } from 'vue';
import {InspectStream, ReadableStream} from '@yume-chan/stream-extra';
import { getAdbInstance } from '@/utils/adbManager.js';
import { VERSION } from '@yume-chan/fetch-scrcpy-server';
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from '@yume-chan/adb-scrcpy';
import {
  CodecOptions,
  ScrcpyVideoCodecId,
  DEFAULT_SERVER_PATH,
  ScrcpyInstanceId,
  ScrcpyLogLevel,
  ScrcpyOptionsLatest,
  h264ParseConfiguration,
  h265ParseConfiguration,
  AndroidMotionEventAction,
  ScrcpyPointerId,
  AndroidMotionEventButton,
  ScrcpyHoverHelper, AndroidKeyEventAction, AndroidKeyCode, AndroidKeyEventMeta,
} from '@yume-chan/scrcpy';
import { DEFAULT_SETTINGS } from '@/utils/scrcpySettings.js';
import { WebCodecsVideoDecoder } from '@yume-chan/scrcpy-decoder-webcodecs';
import {clamp} from "lodash";
import {EditPen} from "@element-plus/icons-vue";
import useWindowResize from "@/utils/useWindowResize.js";

let options
let client
let rotation = 0
let width = ref(0)
let height = ref(0)
let hoverHelper
let videoStream
let aspectRatio
let decoder = null;
const { height: windowHeight } = useWindowResize();
const renderContainer = ref();
const openInput = ref(false)
const adbInstance = computed(() => getAdbInstance());
// 旋转角度常量
const ROTATION_90 = 1;
const ROTATION_180 = 2;
const ROTATION_270 = 3;
/**
 * 将鼠标事件按钮映射到 Android 按钮
 */
const MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON = [
  AndroidMotionEventButton.Primary,
  AndroidMotionEventButton.Tertiary,
  AndroidMotionEventButton.Secondary,
  AndroidMotionEventButton.Back,
  AndroidMotionEventButton.Forward,
];


// 类样式定义
const useClasses = () => ({
  video: {
    transformOrigin: "center center",
    touchAction: "none",
  },
});
const classes = useClasses();
// 计算容器的动态样式
const containerStyle = ref()

// 计算属性获取 rotatedWidth 和 rotatedHeight
const rotatedWidth = computed(() => (rotation & 1 ? height.value : width.value));
const rotatedHeight = computed(() => (rotation & 1 ? width.value : height.value));

// 打开或关闭键盘输入
const openKeyInput = (type) => {
  openInput.value = type === 'open';
  const action = openInput.value ? 'addEventListener' : 'removeEventListener';
  window[action]('keydown', handleKeyEvent);
  window[action]('keyup', handleKeyEvent);
};

// 处理键盘事件
const handleKeyEvent = async (e) => {
  if (openInput.value) {
    await handleKeyCode(e);
  } else {
    console.log('移除键盘监听事件', e);
  }
};

// 初始化视频解码器
const initializeDecoder = async (videoPacketStream, metadata) => {
  try {
    decoder = new WebCodecsVideoDecoder(ScrcpyVideoCodecId.H264, true);

    if (renderContainer.value) {
      renderContainer.value.appendChild(decoder.renderer);
      console.log('添加渲染器到容器decoder.renderer', decoder.renderer);
    } else {
      console.error('渲染容器未找到');
      return;
    }

    const lastKeyframe = ref(0n);
    const handler = new InspectStream((packet) => {
      handlePacket(packet, lastKeyframe, metadata);
    });

    await handleWheelTest();

    if (videoPacketStream && typeof videoPacketStream.pipeTo === 'function') {
      videoPacketStream.pipeThrough(handler).pipeTo(decoder.writable);
    } else {
      console.error('videoPacketStream 无效或不可用');
    }
  } catch (error) {
    console.error('初始化解码器时出错:', error);
  }
};

// 处理传入的视频数据包
const handlePacket = (packet, lastKeyframe, metadata) => {
  if (packet.type === "configuration") {
    handleConfiguration(packet.data, metadata);
  } else if (packet.keyframe && packet.pts !== undefined) {
    handleKeyframe(packet, lastKeyframe);
  }
};

// 处理视频配置变化
const handleConfiguration = (data, metadata) => {
  let croppedWidth, croppedHeight;

  switch (metadata.codec) {
    case ScrcpyVideoCodecId.H264:
      ({ croppedWidth, croppedHeight } = h264ParseConfiguration(data));
      break;
    case ScrcpyVideoCodecId.H265:
      ({ croppedWidth, croppedHeight } = h265ParseConfiguration(data));
      break;
    default:
      throw new Error("Codec not supported");
  }
  console.log(`[client] 视频尺寸变化: ${croppedWidth}x${croppedHeight}`);
  width.value = croppedWidth;
  height.value = croppedHeight;
  changeStyle(metadata);
};

// 处理关键帧数据包
const handleKeyframe = (packet, lastKeyframe) => {
  if (lastKeyframe.value) {
    const interval = (Number(packet.pts - lastKeyframe.value) / 1000) | 0;
    console.log(`[client] 关键帧间隔: ${interval}ms`);
    rotateScreen(rotation);
  }
  lastKeyframe.value = packet.pts;
};

// 更改样式，基于宽高计算和旋转调整
const changeStyle = () => {
  // 计算并交换后的宽度和高度
  const [calcWidth, calcHeight] = swapWidthHeight(width.value, height.value);
  console.log('计算后的宽高:', calcWidth, calcHeight);

  // 设置渲染器的样式宽高
  setRendererStyle(decoder.renderer, calcWidth, calcHeight);

  // 更新容器的样式
  updateContainerStyle(calcWidth, calcHeight);
};

/**
 * 设置渲染器的样式宽高
 * @param {HTMLElement} renderer 渲染器元素
 * @param {number} calcWidth 宽度
 * @param {number} calcHeight 高度
 */
const setRendererStyle = (renderer, calcWidth, calcHeight) => {
  renderer.style.width = `${calcWidth}px`;
  renderer.style.height = `${calcHeight}px`;
};

/**
 * 更新容器的样式
 * @param {number} calcWidth 宽度
 * @param {number} calcHeight 高度
 */
const updateContainerStyle = (calcWidth, calcHeight) => {
  containerStyle.value = {
    width: `${calcWidth}px`,
    height: `${calcHeight}px`,
    borderRadius: "20px",
    overflow: "hidden",
    transform: `translate(${(rotatedWidth.value - width.value) / 2}px, ${(rotatedHeight.value - height.value) / 2}px) rotate(${rotation * 90}deg)`,
  };
};


/**
 * 根据传入的宽高，如果宽度大于高度则交换宽高
 * @param {number} widthVal 当前宽度
 * @param {number} heightVal 当前高度
 * @returns {Array} 返回计算后的宽度和高度 [宽度, 高度]
 */
const swapWidthHeight = (widthVal, heightVal) => {
  const width = calculateWidth();
  const height = windowHeight.value - 145; // 设置固定的高度基准

  // 如果宽度大于高度，交换它们
  return widthVal > heightVal ? [height, width] : [width, height];
};

/**
 * 根据当前高度等比计算宽度
 * @returns {number} 返回计算出的宽度
 */
const calculateWidth = () => {
  // 如果当前高度大于宽度，则计算宽高比
  if (height.value > width.value) {
    aspectRatio = width.value / height.value;
  }

  // 按高度和宽高比计算等比宽度
  return Number(((windowHeight.value - 145) * aspectRatio).toFixed(0));
};

/**
 * 初始化 scrcpy 测试，推送服务端并启动 scrcpy 客户端
 */
const scrcpyTest = async () => {
  try {
    console.log('Scrcpy 版本:', VERSION);

    const serverBuffer = await fetchServerBinary('/server.bin');
    const adb = await adbInstance.value;

    await pushServerToAdb(adb, serverBuffer);
    console.log('服务端已推送');

    await startScrcpyClient(adb);
  } catch (error) {
    console.error('初始化 scrcpy 时出错:', error);
  }
};

/**
 * 获取服务端二进制文件
 * @param {string} path 服务端文件路径
 * @returns {Promise<ArrayBuffer>} 返回服务端二进制文件的 ArrayBuffer
 */
const fetchServerBinary = async (path) => {
  const serverUrl = new URL(path, import.meta.url);
  const response = await fetch(serverUrl);
  return await response.arrayBuffer();
};

/**
 * 将服务端文件推送到 ADB
 * @param adb ADB 实例
 * @param {ArrayBuffer} serverBuffer 服务端二进制文件的 ArrayBuffer
 */
const pushServerToAdb = async (adb, serverBuffer) => {
  await AdbScrcpyClient.pushServer(
      adb,
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(serverBuffer));
          controller.close();
        },
      })
  );
};

/**
 * 启动 scrcpy 客户端并初始化视频流
 * @param  adb ADB 实例
 */
const startScrcpyClient = async (adb) => {
  try {
    const videoCodecOptions = new CodecOptions();
    options = new AdbScrcpyOptionsLatest(
        new ScrcpyOptionsLatest({
          ...DEFAULT_SETTINGS,
          logLevel: ScrcpyLogLevel.Debug,
          scid: ScrcpyInstanceId.random(),
          sendDeviceMeta: true,
          sendDummyByte: true,
          videoCodecOptions,
        })
    );

    // 创建 ScrcpyHoverHelper 实例
    hoverHelper = new ScrcpyHoverHelper();

    // 启动 scrcpy 客户端
    client = await AdbScrcpyClient.start(adb, DEFAULT_SERVER_PATH, VERSION, options);
    videoStream = await client.videoStream;

    if (videoStream) {
      await initializeVideoStream(videoStream);
      console.log('视频流已启动');
    }
  } catch (error) {
    console.error('启动 scrcpy 客户端时出错:', error);
  }
};

/**
 * 初始化视频流并设置宽高
 * @param {Object} videoStream 视频流对象
 */
const initializeVideoStream = async (videoStream) => {
  const { metadata, stream: videoPacketStream } = videoStream;
  console.log('视频元数据:', metadata);
  console.log('视频元数据的 codec:', metadata.codec);

  // 设置宽高
  width.value = metadata.width;
  height.value = metadata.height;

  // 初始化解码器
  await initializeDecoder(videoPacketStream, metadata);
};


/**
 * 将客户端坐标转换为设备坐标
 * @param {number} clientX 客户端 X 坐标
 * @param {number} clientY 客户端 Y 坐标
 * @returns {Object} 设备坐标对象 { x, y }
 */
const clientPositionToDevicePosition = (clientX, clientY) => {
  if (!renderContainer.value) {
    return { x: 0, y: 0 }; // 如果渲染容器不存在，返回默认坐标
  }

  const viewRect = renderContainer.value.getBoundingClientRect();
  const pointerViewX = clamp((clientX - viewRect.x) / viewRect.width, 0, 1);
  const pointerViewY = clamp((clientY - viewRect.y) / viewRect.height, 0, 1);

  // 根据旋转调整坐标
  const adjustedPosition = adjustPositionForRotation(pointerViewX, pointerViewY, rotation);

  return {
    x: adjustedPosition.x * width.value,
    y: adjustedPosition.y * height.value,
  };
};

/**
 * 根据旋转角度调整坐标
 * @param {number} pointerViewX 调整前的 X 坐标
 * @param {number} pointerViewY 调整前的 Y 坐标
 * @param {number} rotation 旋转角度
 * @returns {Object} 调整后的坐标 { x, y }
 */
const adjustPositionForRotation = (pointerViewX, pointerViewY, rotation) => {
  let adjustedX = pointerViewX;
  let adjustedY = pointerViewY;

  // 处理坐标旋转
  switch (rotation) {
    case ROTATION_90:
      [adjustedX, adjustedY] = [adjustedY, adjustedX]; // 90度旋转
      adjustedY = 1 - adjustedY; // 反转 Y 坐标
      break;
    case ROTATION_180:
      adjustedX = 1 - adjustedX; // 180度旋转，反转 X 坐标
      adjustedY = 1 - adjustedY; // 反转 Y 坐标
      break;
    case ROTATION_270:
      [adjustedX, adjustedY] = [adjustedY, adjustedX]; // 270度旋转
      adjustedX = 1 - adjustedX; // 反转 X 坐标
      break;
  }

  return { x: adjustedX, y: adjustedY };
};

// 事件处理器注册
const handleWheelTest = async () => {
  renderContainer.value.addEventListener("wheel", handleWheel, { passive: false });
};

/**
 * 防止事件的默认行为和传播
 * @param {Event} event 事件对象
 */
const preventEventDefaults = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

/**
 * 处理滚轮事件
 * @param {WheelEvent} event 滚轮事件
 */
const handleWheel = async (event) => {
  preventEventDefaults(event); // 预防默认事件行为

  const { x, y } = clientPositionToDevicePosition(event.clientX, event.clientY);
  await client.controller.injectScroll({
    pointerX: x,
    pointerY: y,
    screenWidth: width.value,
    screenHeight: height.value,
    scrollX: -event.deltaX / 100,
    scrollY: -event.deltaY / 100,
    buttons: 0,
  });
};

/**
 * 注入触控事件
 * @param {number} action 事件动作
 * @param {PointerEvent} event 触控事件
 */
const injectTouch = async (action, event) => {
  const pointerId = (event.pointerType === "mouse")
      ? ScrcpyPointerId.Finger // Android 13 has bug with mouse injection
      : BigInt(event.pointerId);

  const { x, y } = clientPositionToDevicePosition(event.clientX, event.clientY);

  const messages = hoverHelper.process({
    action,
    pointerId,
    screenWidth: width.value,
    screenHeight: height.value,
    pointerX: x,
    pointerY: y,
    pressure: event.pressure,
    actionButton: MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[event.button],
    buttons: event.buttons,
  });

  for (const message of messages) {
    await client.controller.injectTouch(message);
  }
};

/**
 * 处理指针按下事件
 * @param {PointerEvent} event 指针事件
 */
const handlePointerDown = async (event) => {
  preventEventDefaults(event);
  event.currentTarget.setPointerCapture(event.pointerId);
  await injectTouch(AndroidMotionEventAction.Down, event);
};

/**
 * 处理指针移动事件
 * @param {PointerEvent} event 指针事件
 */
const handlePointerMove = async (event) => {
  preventEventDefaults(event);
  const action = event.buttons === 0 ? AndroidMotionEventAction.HoverMove : AndroidMotionEventAction.Move;
  await injectTouch(action, event);
};

/**
 * 处理指针抬起事件
 * @param {PointerEvent} event 指针事件
 */
const handlePointerUp = async (event) => {
  preventEventDefaults(event);
  await injectTouch(AndroidMotionEventAction.Up, event);
};

/**
 * 处理指针离开事件
 * @param {PointerEvent} event 指针事件
 */
const handlePointerLeave = async (event) => {
  preventEventDefaults(event);
  await injectTouch(AndroidMotionEventAction.HoverExit, event);
  await injectTouch(AndroidMotionEventAction.Up, event);
};

/**
 * 处理右键菜单事件
 * @param {MouseEvent} event 鼠标事件
 */
const handleContextMenu = (event) => {
  preventEventDefaults(event);
};

/**
 * 处理键盘事件
 * @param {KeyboardEvent} e 键盘事件
 */
const handleKeyCode = async (e) => {
  const keyCode = AndroidKeyCode[e.code];
  if (keyCode) {
    await client.controller.injectKeyCode({
      action: e.type === 'keydown' ? AndroidKeyEventAction.Down : AndroidKeyEventAction.Up,
      keyCode,
      repeat: 0,
      metaState: AndroidKeyEventMeta.NumLockOn,
    });
  }
};

/**
 * 旋转屏幕并重启解码器
 * @param {number} newRotation 新的旋转角度
 */
const rotateScreen = async (newRotation) => {
  rotation = newRotation;

  // 停止解码器并清理
  if (decoder) {
    client.close();
    renderContainer.value.removeChild(decoder.renderer); // 确保移除 Canvas
    decoder = null;
    console.log('解码器已关闭');
  }
  await scrcpyTest();
};
onMounted(() => {
  scrcpyTest();
})
onBeforeUnmount(() => {
  console.log("销毁 scrcpy");
  if (client) {
    client.close();
  }
  if (decoder) {
    renderContainer.value.removeChild(decoder.renderer);
    decoder = null;
  }
});
</script>


<style lang="scss" scoped>
.video {
  border: 3px solid #303133;
  background-color: #303133;
  cursor: url("/src/assets/img/pointer.png") 2 0, crosshair;
}
</style>