import { defineStore } from "pinia";

export const useDeviceStore = defineStore('device', {
    state: () => ({
        adbObject: {},
        deviceInfo: {}
    }),
    actions: {
        setAdb(adb) {
            this.adbObject = adb;
        },
        setDeviceInfo(deviceInfo) {
            this.deviceInfo = deviceInfo;
        },
        reset() {
            this.adbObject = {};
            this.deviceInfo = {};
        }
    },
    getters: {
        getAdb() {
            return this.adbObject;
        },
        getDeviceInfo() {
            return this.deviceInfo;
        }
    }
});
