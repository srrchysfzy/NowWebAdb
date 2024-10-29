import {
    ScrcpyVideoOrientation,
} from "@yume-chan/scrcpy";

export const DEFAULT_SETTINGS = {
    maxSize: 1080,
    videoBitRate: 8000000,
    videoCodec: "h264",
    lockVideoOrientation: ScrcpyVideoOrientation.Unlocked,
    displayId: 0,
    crop: "",
    powerOn: true,
    audio: false,
    audioCodec: "aac",
};