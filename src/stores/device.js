import { defineStore } from 'pinia';

export const useDeviceStore = defineStore('device', {
    state: () => ({
        adbObject: {},
        deviceInfo: {},
    }),
    actions: {
        updateAdb(adb) {
            this.adbObject = adb;
        },
        updateDeviceInfo(deviceInfo) {
            this.deviceInfo = deviceInfo;
        },
        reset() {
            this.adbObject = {};
            this.deviceInfo = {};
        }
    },
    getters: {
        getDeviceInfo(state) {
            return state.deviceInfo
        },
        getAdbObject(state){
            return state.adbObject
        },
    }
});
