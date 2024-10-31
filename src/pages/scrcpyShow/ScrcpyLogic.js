import { ref, computed } from 'vue';
import { InspectStream, ReadableStream } from '@yume-chan/stream-extra';
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
    ScrcpyHoverHelper,
    AndroidKeyEventAction,
    AndroidKeyCode,
    AndroidKeyEventMeta,
} from '@yume-chan/scrcpy';
import { DEFAULT_SETTINGS } from '@/utils/scrcpySettings.js';
import { WebCodecsVideoDecoder } from '@yume-chan/scrcpy-decoder-webcodecs';
import { clamp } from "lodash";
import useWindowResize from "@/utils/useWindowResize.js";

const useScrcpy = () => {
    let options
    let client
    let rotation = 0
    let width = ref(0)
    let height = ref(0)
    let hoverHelper
    let videoStream
    let aspectRatio
    let decoder = null;
    const {height: windowHeight} = useWindowResize();
    const renderContainer = ref();
    const openInput = ref(false)
    const adbInstance = computed(() => getAdbInstance());
    const lastKeyframe = ref(0n);
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

    /**
     * 初始化 scrcpy 测试，推送服务端并启动 scrcpy 客户端
     */
    const scrcpyTest = async (renderRef) => {
        try {
            console.log('Scrcpy 版本:', VERSION);
            console.log('renderRef', renderRef.renderContainer)
            renderContainer.value = renderRef.renderContainer;
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
            client.stdout.pipeTo(new WritableStream({
                write: (line) => {
                    console.log('stdout:', line);
                },
            })).then(r =>  console.log('pipeTo', r));

            videoStream = await client.videoStream;

            if (videoStream) {
                initializeVideoStream(videoStream);
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
    const initializeVideoStream = (videoStream) => {
        const {metadata, stream: videoPacketStream} = videoStream;
        console.log('视频元数据:', metadata);
        console.log('视频元数据的 codec:', metadata.codec);

        // 设置宽高
        width.value = metadata.width;
        height.value = metadata.height;

        // 初始化解码器
        initializeDecoder(videoPacketStream, metadata);
    };


    /**
     * 初始化视频解码器，连接视频流并将渲染器附加到容器。
     * @param {ReadableStream} videoPacketStream - 视频数据包流。
     * @param {Object} metadata - 包含视频宽高和编码信息的元数据。
     */
    const initializeDecoder = (videoPacketStream, metadata) => {
        try {
            // 设置解码器
            decoder = new WebCodecsVideoDecoder(ScrcpyVideoCodecId.H264, true);

            // 检查并附加渲染器
            if (!renderContainer.value) {
                console.error('渲染容器未找到');
                return;
            }
            renderContainer.value.appendChild(decoder.renderer);
            console.log('添加渲染器到容器:', decoder.renderer);

            // 重置关键帧跟踪
            lastKeyframe.value = 0n;

            // 处理视频包
            const handler = new InspectStream((packet) => handlePacket(packet, metadata));

            // 绑定滚轮事件
            handleWheelTest();

            // 连接视频流
            if (videoPacketStream && typeof videoPacketStream.pipeTo === 'function') {
                videoPacketStream.pipeThrough(handler).pipeTo(decoder.writable);
                console.log('视频流已连接到解码器');
            } else {
                console.error('videoPacketStream 无效或不可用');
            }
        } catch (error) {
            console.error('初始化解码器时出错:', error);
        }
    };


    /**
     * 处理传入的视频数据包，区分配置包和关键帧。
     * @param {Object} packet - 视频数据包，包含类型和时间戳等信息。
     * @param {Object} metadata - 视频的元数据，用于获取编码信息。
     */
    const handlePacket = (packet, metadata) => {
        if (packet.type === "configuration") {
            handleConfiguration(packet.data, metadata);
        } else if (packet.keyframe && packet.pts !== undefined) {
            handleKeyframe(packet);
        }
    };

    /**
     * 处理视频配置变化，解析视频宽高并更新样式。
     * @param {Uint8Array} data - 视频配置数据。
     * @param {Object} metadata - 视频的元数据，包含编码信息。
     */
    const handleConfiguration = (data, metadata) => {
        let croppedWidth, croppedHeight;
        // 根据编码类型解析宽高
        switch (metadata.codec) {
            case ScrcpyVideoCodecId.H264:
                ({ croppedWidth, croppedHeight } = h264ParseConfiguration(data));
                break;
            case ScrcpyVideoCodecId.H265:
                ({ croppedWidth, croppedHeight } = h265ParseConfiguration(data));
                break;
            default:
                throw new Error("Unsupported codec");
        }
        console.log(`[client] 视频尺寸变化: ${croppedWidth}x${croppedHeight}`);

        // 更新宽高并调整样式
        width.value = croppedWidth;
        height.value = croppedHeight;
        changeStyle();
    };

    /**
     * 处理关键帧数据包，记录关键帧间隔时间。
     * @param {Object} packet - 包含关键帧数据和时间戳。
     */
    const handleKeyframe = (packet) => {
        if (lastKeyframe.value) {
            const interval = Math.floor(Number(packet.pts - lastKeyframe.value) / 1000);
            console.log(`[client] 关键帧间隔: ${interval}ms`);
        }
        lastKeyframe.value = packet.pts;
    };

    /**
     * 根据宽高和旋转调整容器和渲染器样式。
     */
    const changeStyle = () => {
        const [calcWidth, calcHeight] = swapWidthHeight(width.value, height.value);
        console.log('计算后的宽高:', calcWidth, calcHeight);

        // 更新渲染器样式
        setRendererStyle(decoder.renderer, calcWidth, calcHeight);

        // 更新容器样式
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
     * 将客户端坐标转换为设备坐标
     * @param {number} clientX 客户端 X 坐标
     * @param {number} clientY 客户端 Y 坐标
     * @returns {Object} 设备坐标对象 { x, y }
     */
    const clientPositionToDevicePosition = (clientX, clientY) => {
        if (!renderContainer.value) {
            return {x: 0, y: 0}; // 如果渲染容器不存在，返回默认坐标
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

        return {x: adjustedX, y: adjustedY};
    };

// 事件处理器注册
    const handleWheelTest = () => {
        renderContainer.value.addEventListener("wheel", handleWheel, {passive: false});
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

        const {x, y} = clientPositionToDevicePosition(event.clientX, event.clientY);
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

        const {x, y} = clientPositionToDevicePosition(event.clientX, event.clientY);

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
     * 销毁逻辑
     * @returns {Promise<void>}
     */
    const destroyClient = async () => {
        const container = renderContainer.value;
        if (container) {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("contextmenu", handleContextMenu);
            container.removeEventListener("keydown", handleKeyCode);
            container.removeEventListener("keyup", handleKeyCode);
            container.removeEventListener("pointerdown", handlePointerDown);
            container.removeEventListener("pointermove", handlePointerMove);
            container.removeEventListener("pointerup", handlePointerUp);
            container.removeEventListener("pointerleave", handlePointerLeave);
        }

        if (client) {
            await client.close();
        }

        if (decoder) {
            if (decoder.renderer && container) {
                container.removeChild(decoder.renderer);
            }
            decoder = null;
        }
    }

    return {
        decoder,
        client,
        width,
        height,
        rotation,
        openInput,
        renderContainer,
        containerStyle,
        classes,
        openKeyInput,
        handleKeyEvent,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerLeave,
        handleContextMenu,
        scrcpyTest,
        destroyClient,
    };
};

export { useScrcpy };
