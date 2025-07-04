import { ref, computed } from 'vue';
import { InspectStream, ReadableStream } from '@yume-chan/stream-extra';
import { getAdbInstance } from '@/utils/adbManager.js';
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from '@yume-chan/adb-scrcpy';
import {
    ScrcpyVideoCodecId,
    h264ParseConfiguration,
    h265ParseConfiguration,
    AndroidMotionEventAction,
    ScrcpyInstanceId,
    AndroidMotionEventButton,
    AndroidKeyEventAction,
    AndroidKeyCode,
    AndroidKeyEventMeta,
    DefaultServerPath,
    ScrcpyPointerId,
} from '@yume-chan/scrcpy';
import { DEFAULT_SETTINGS } from '@/utils/scrcpySettings.js';
import { WebCodecsVideoDecoder, WebGLVideoFrameRenderer } from '@yume-chan/scrcpy-decoder-webcodecs';
import { clamp } from "lodash";
import useWindowResize from "@/utils/useWindowResize.js";
import {pushServerAndStartScrcpyClient} from "@/utils/adbUtils.js";

const useScrcpy = () => {
    let options
    let client
    let rotation = 0
    let videoStream
    let aspectRatio
    let decoder = null;
    // 设备真实分辨率（用于触控坐标计算）
    let deviceRealWidth = 0;
    let deviceRealHeight = 0;
    const width = ref(0)
    const height = ref(0)
    const {height: windowHeight, width: windowWidth} = useWindowResize();
    const renderContainer = ref();
    const openInput = ref(false)
    const adbInstance = computed(() => getAdbInstance());
    const lastKeyframe = ref(0n);
    // 增加连接状态
    const connectionStatus = ref('idle'); // idle, connecting, connected, error
    const connectionError = ref('');
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
    const handleKeyEvent = async (e, code=null) => {
        if (code){
            await handleKeyCode(e, code);
        } else {
            if (openInput.value) {
                await handleKeyCode(e);
                    }
        }
    };

    /**
     * 初始化 scrcpy 测试，推送服务端并启动 scrcpy 客户端
     */
    const scrcpyStart = async (renderRef) => {
        try {
            connectionStatus.value = 'connecting';
            connectionError.value = '';
            renderContainer.value = renderRef.renderContainer;
            const adb = adbInstance.value;
            
            if (!adb) {
                throw new Error('ADB 实例未初始化');
            }
            
            await pushServerAndStartScrcpyClient(adb, '/server.bin');
            console.log('服务端已推送');

            await startScrcpyClient(adb);
        } catch (error) {
            console.error('初始化 scrcpy 时出错:', error);
            connectionStatus.value = 'error';
            connectionError.value = `连接错误: ${error.message || '未知错误'}`;
        }
    };

    /**
     * 获取设备真实分辨率
     * @param {Object} adb ADB 实例
     */
    const getDeviceRealResolution = async (adb) => {
        try {
            // 使用 ADB 命令获取设备分辨率
            if (adb.subprocess.shellProtocol?.isSupported) {
                const result = await adb.subprocess.shellProtocol.spawnWaitText('wm size');
                
                // 解析输出，格式通常是 "Physical size: 2160x1080"
                const match = result.stdout.match(/(\d+)x(\d+)/);
                if (match) {
                    deviceRealWidth = parseInt(match[1]);
                    deviceRealHeight = parseInt(match[2]);
                    return true;
                }
            }
        } catch (error) {
            // 忽略错误，使用默认值
        }
        
        // 如果 ADB 命令失败，手动设置已知的设备分辨率
        deviceRealWidth = 1080;
        deviceRealHeight = 2160;
        return true;
    };

    /**
     * 启动 scrcpy 客户端并初始化视频流
     * @param adb ADB 实例
     */
    const startScrcpyClient = async (adb) => {
        try {
            // 首先获取设备真实分辨率
            await getDeviceRealResolution(adb);
            
            options = new AdbScrcpyOptionsLatest({
                ...DEFAULT_SETTINGS,
                scid: ScrcpyInstanceId.random(),
            });

            // 启动 scrcpy 客户端
            client = await AdbScrcpyClient.start(adb, DefaultServerPath, options);
            
            // 处理服务器输出
            client.output.pipeTo(new WritableStream({
                write: (line) => {
                    console.log('scrcpy server:', line);
                },
            })).catch(e => {
                console.error('output stream error:', e);
                connectionStatus.value = 'error';
                connectionError.value = `输出流错误: ${e.message || '未知错误'}`;
            });

            // 获取视频流
            videoStream = await client.videoStream;

            if (videoStream) {
                initializeVideoStream(videoStream);
                console.log('视频流已启动');
                connectionStatus.value = 'connected';
            } else {
                throw new Error('无法获取视频流');
            }

            // 检查控制器状态
            if (client.controller) {
                console.log('控制器已初始化，可以进行触控操作');
            } else {
                console.error('控制器未初始化，无法进行触控操作');
                // 这不是致命错误，所以不改变连接状态
            }
        } catch (error) {
            console.error('启动 scrcpy 客户端时出错:', error);
            connectionStatus.value = 'error';
            connectionError.value = `客户端错误: ${error.message || '未知错误'}`;
            throw error;
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

        // 设置视频流的宽高（可能是缩放后的）
        width.value = metadata.width;
        height.value = metadata.height;

        // 尝试获取设备真实分辨率
        if (metadata.deviceWidth && metadata.deviceHeight) {
            deviceRealWidth = metadata.deviceWidth;
            deviceRealHeight = metadata.deviceHeight;
        } else if (deviceRealWidth === 0 || deviceRealHeight === 0) {
            // 只有在之前没有设置过真实分辨率时才使用视频流分辨率
            deviceRealWidth = metadata.width;
            deviceRealHeight = metadata.height;
        }

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
            // 创建渲染器
            const renderer = new WebGLVideoFrameRenderer();
            
            // 设置解码器，使用实际的 codec
            decoder = new WebCodecsVideoDecoder({
                codec: metadata.codec,
                renderer: renderer,
                // 添加错误处理回调
                onError: (error) => {
                    console.warn('解码器错误:', error);
                }
            });

            // 检查并附加渲染器
            if (!renderContainer.value) {
                console.error('渲染容器未找到');
                return;
            }
            renderContainer.value.appendChild(renderer.canvas);

            // 重置关键帧跟踪
            lastKeyframe.value = 0n;

            // 处理视频包
            const handler = new InspectStream((packet) => {
                try {
                    handlePacket(packet, metadata);
                } catch (error) {
                    console.warn('处理视频包时出错:', error);
                }
            });

            // 连接视频流
            if (videoPacketStream && typeof videoPacketStream.pipeTo === 'function') {
                // 添加错误处理
                videoPacketStream
                    .pipeThrough(handler)
                    .pipeTo(decoder.writable)
                    .catch(error => {
                        // 忽略组件卸载时的常见错误
                        if (error.name !== 'AbortError' && 
                            !error.message.includes('locked') && 
                            !error.message.includes('closed')) {
                            console.error('视频流处理错误:', error);
                        }
                    });
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
        if (decoder && decoder.renderer) {
            setRendererStyle(decoder.renderer.canvas, calcWidth, calcHeight);
        }

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
        // 使用实际的 canvas 元素进行坐标计算
        const canvas = decoder?.renderer?.canvas;
        if (!canvas) {
            console.warn('Canvas 未找到，使用容器进行坐标计算');
            if (!renderContainer.value) {
                return {x: 0, y: 0};
            }
            const viewRect = renderContainer.value.getBoundingClientRect();
            const pointerViewX = clamp((clientX - viewRect.x) / viewRect.width, 0, 1);
            const pointerViewY = clamp((clientY - viewRect.y) / viewRect.height, 0, 1);
            const adjustedPosition = adjustPositionForRotation(pointerViewX, pointerViewY, rotation);
            return {
                x: adjustedPosition.x * width.value,
                y: adjustedPosition.y * height.value,
            };
        }

        const canvasRect = canvas.getBoundingClientRect();
        const pointerViewX = clamp((clientX - canvasRect.x) / canvasRect.width, 0, 1);
        const pointerViewY = clamp((clientY - canvasRect.y) / canvasRect.height, 0, 1);



        // 根据旋转调整坐标
        const adjustedPosition = adjustPositionForRotation(pointerViewX, pointerViewY, rotation);

        // 根据官方文档，坐标应该基于视频尺寸，而不是设备真实分辨率
        const videoX = clamp(adjustedPosition.x * width.value, 0, width.value - 1);
        const videoY = clamp(adjustedPosition.y * height.value, 0, height.value - 1);



        return {
            x: videoX,
            y: videoY,
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

// 事件处理器已通过 Vue 模板绑定

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

        if (!client || !client.controller) {
            console.error('客户端或控制器未初始化');
            return;
        }

        const {x, y} = clientPositionToDevicePosition(event.clientX, event.clientY);
        
        try {
            await client.controller.injectScroll({
                pointerX: x,
                pointerY: y,
                videoWidth: width.value,
                videoHeight: height.value,
                scrollX: -event.deltaX / 100,
                scrollY: -event.deltaY / 100,
                buttons: 0,
            });
        } catch (error) {
            console.error('滚轮事件注入失败:', error);
        }
    };

    /**
     * 注入触控事件
     * @param {number} action 事件动作
     * @param {PointerEvent} event 触控事件
     */
    const injectTouch = async (action, event) => {
        if (!client || !client.controller) {
            console.error('客户端或控制器未初始化');
            return;
        }

        // 使用官方推荐的 ScrcpyPointerId.Finger
        const pointerId = ScrcpyPointerId.Finger;
        const {x, y} = clientPositionToDevicePosition(event.clientX, event.clientY);

        // 确保压力值有效，根据官方文档示例
        const pressure = event.buttons === 0 ? 0 : 1;
        const actionButton = MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[event.button] || MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[0];

        try {
            await client.controller.injectTouch({
                action,
                pointerId,
                videoWidth: width.value,
                videoHeight: height.value,
                pointerX: x,
                pointerY: y,
                pressure,
                actionButton,
                buttons: event.buttons,
            });
        } catch (error) {
            console.error('触控事件注入失败:', error);
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
        
        let action;
        if (event.buttons === 0) {
            // 根据官方文档，悬停时使用 HoverMove
            action = AndroidMotionEventAction.HoverMove;
                 } else {
             // 拖拽时使用 Move
             action = AndroidMotionEventAction.Move;
         }
        
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
        // 如果有按钮按下，发送抬起事件
        if (event.buttons > 0) {
            await injectTouch(AndroidMotionEventAction.Up, event);
        }
        // 不发送 HoverExit，因为这不是正常的触控操作
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
     * @param code 屏幕物理按键专用
     */
    const handleKeyCode = async (e, code = null) => {
        let action;
        let keyRepeat = false;
        if (e) {
            // For physical keyboard events
            action = e.type === 'keydown' ? AndroidKeyEventAction.Down : AndroidKeyEventAction.Up;
            keyRepeat = e.repeat;
        } else {
            // For virtual button clicks, we simulate a full press (Down and Up)
            action = AndroidKeyEventAction.Down;
        }

        // If 'code' is provided (from a virtual button), use it.
        // Otherwise, get the code from the physical keyboard event.
        const finalKeyCode = code || AndroidKeyCode[e.code];
        if (!finalKeyCode) {
            return;
        }

        if (e && e.defaultPrevented) {
            return;
        }

        // Send the key-down event
        await client.controller?.injectKeyCode({
            action,
            keyCode: finalKeyCode,
            repeat: keyRepeat ? 1 : 0,
            metaState: 0,
        });

        // If it was a virtual click (no 'e'), send the key-up event immediately
        if (!e) {
            await client.controller?.injectKeyCode({
                action: AndroidKeyEventAction.Up,
                keyCode: finalKeyCode,
                repeat: 0,
                metaState: 0,
            });
        }
    };

    /**
     * 销毁逻辑
     * @returns {Promise<void>}
     */
    const destroyClient = async () => {
        try {
            console.log("销毁 scrcpy 客户端资源开始");
            
            // 重置连接状态
            connectionStatus.value = 'idle';
            connectionError.value = '';
            
            // 销毁解码器
            if (decoder) {
                try {
                    await decoder.dispose();
                    decoder = null;
                } catch (e) {
                    console.warn("解码器销毁出错:", e);
                }
            }
            
            // 销毁客户端
            if (client) {
                try {
                    await client.dispose();
                    client = null;
                } catch (e) {
                    console.warn("客户端销毁出错:", e);
                }
            }
            
            // 清理DOM元素
            if (renderContainer.value) {
                while (renderContainer.value.firstChild) {
                    renderContainer.value.removeChild(renderContainer.value.firstChild);
                }
            }
            
            // 重置所有状态变量
            width.value = 0;
            height.value = 0;
            deviceRealWidth = 0;
            deviceRealHeight = 0;
            videoStream = null;
            
            console.log("销毁 scrcpy 客户端资源完成");
        } catch (e) {
            console.error("销毁 scrcpy 客户端资源时出错:", e);
        }
    };

    return {
        decoder,
        client,
        width,
        height,
        windowWidth,
        windowHeight,
        rotation,
        openInput,
        renderContainer,
        containerStyle,
        classes,
        changeStyle,
        swapWidthHeight,
        openKeyInput,
        handleKeyEvent,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerLeave,
        handleContextMenu,
        handleWheel,
        scrcpyStart,
        destroyClient,
        // 新增状态
        connectionStatus,
        connectionError
    };
};

export { useScrcpy };