import {
    AndroidKeyCode,
    AndroidKeyEventAction,
    AndroidKeyEventMeta,
    AndroidMotionEventAction,
    AndroidMotionEventButton,
    ScrcpyHoverHelper,
    ScrcpyPointerId
} from "@yume-chan/scrcpy";
import { clamp } from "lodash";
import { getRenderContainer, getScreenSize } from "@/utils/adbManager.js";


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

class ScrcpyController {
    constructor(client) {
        this.client = client;
        this.hoverHelper = new ScrcpyHoverHelper();
        this.renderContainer = getRenderContainer();
        const [width, height, rotation] = getScreenSize();
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }

    clientPositionToDevicePosition(clientX, clientY) {
        if (!this.renderContainer.value) {
            return { x: 0, y: 0 }; // 如果渲染容器不存在，返回默认坐标
        }

        const viewRect = this.renderContainer.value.getBoundingClientRect();
        const pointerViewX = clamp((clientX - viewRect.x) / viewRect.width, 0, 1);
        const pointerViewY = clamp((clientY - viewRect.y) / viewRect.height, 0, 1);

        // 根据旋转调整坐标
        const adjustedPosition = this.adjustPositionForRotation(pointerViewX, pointerViewY);
        return {
            x: adjustedPosition.x * this.width.value,
            y: adjustedPosition.y * this.height.value,
        };
    }

    adjustPositionForRotation(pointerViewX, pointerViewY) {
        let adjustedX = pointerViewX;
        let adjustedY = pointerViewY;

        switch (this.rotation.value) {
            case ROTATION_90:
                [adjustedX, adjustedY] = [adjustedY, adjustedX];
                adjustedY = 1 - adjustedY;
                break;
            case ROTATION_180:
                adjustedX = 1 - adjustedX;
                adjustedY = 1 - adjustedY;
                break;
            case ROTATION_270:
                [adjustedX, adjustedY] = [adjustedY, adjustedX];
                adjustedX = 1 - adjustedX;
                break;
        }

        return { x: adjustedX, y: adjustedY };
    }

    preventEventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    async handleWheel(event) {
        this.preventEventDefaults(event);
        const { x, y } = this.clientPositionToDevicePosition(event.clientX, event.clientY);
        await this.client.value.controller.injectScroll({
            pointerX: x,
            pointerY: y,
            screenWidth: this.width.value,
            screenHeight: this.height.value,
            scrollX: -event.deltaX / 100,
            scrollY: -event.deltaY / 100,
            buttons: 0,
        });
    }

    async injectTouch(action, event) {
        const pointerId = (event.pointerType === "mouse")
            ? ScrcpyPointerId.Finger
            : BigInt(event.pointerId);

        const { x, y } = this.clientPositionToDevicePosition(event.clientX, event.clientY);
        const messages = this.hoverHelper.process({
            action,
            pointerId,
            screenWidth: this.width.value,
            screenHeight: this.height.value,
            pointerX: x,
            pointerY: y,
            pressure: event.pressure,
            actionButton: MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[event.button],
            buttons: event.buttons,
        });

        for (const message of messages) {
            await this.client.value.controller.injectTouch(message);
        }
    }

    async handlePointerDown(event) {
        this.preventEventDefaults(event);
        event.currentTarget.setPointerCapture(event.pointerId);
        await this.injectTouch(AndroidMotionEventAction.Down, event);
    }

    async handlePointerMove(event) {
        this.preventEventDefaults(event);
        const action = event.buttons === 0 ? AndroidMotionEventAction.HoverMove : AndroidMotionEventAction.Move;
        await this.injectTouch(action, event);
    }

    async handlePointerUp(event) {
        this.preventEventDefaults(event);
        await this.injectTouch(AndroidMotionEventAction.Up, event);
    }

    async handlePointerLeave(event) {
        this.preventEventDefaults(event);
        await this.injectTouch(AndroidMotionEventAction.HoverExit, event);
        await this.injectTouch(AndroidMotionEventAction.Up, event);
    }

    async handleContextMenu(event) {
        this.preventEventDefaults(event);
    }

    async handleKeyCode(event) {
        const keyCode = AndroidKeyCode[event.code];
        if (keyCode) {
            await this.client.value.controller.injectKeyCode({
                action: event.type === 'keydown' ? AndroidKeyEventAction.Down : AndroidKeyEventAction.Up,
                keyCode,
                repeat: 0,
                metaState: AndroidKeyEventMeta.NumLockOn,
            });
        }
    }
}

export default ScrcpyController;
