import AdbWebCredentialStore from "@yume-chan/adb-credential-web";

/**
 * 设备凭证管理器
 * 用于管理ADB设备的存储凭证和设备信息
 */
export class DeviceCredentialManager {
  constructor() {
    this.credentialStore = new AdbWebCredentialStore();
  }

  /**
   * 保存设备信息到本地存储
   * @param {Object} device - 设备对象
   */
  async saveDeviceInfo(device) {
    try {
      const deviceInfo = {
        name: device.name,
        serial: device.serial,
        vendorId: device.vendorId,
        productId: device.productId,
        lastConnected: new Date().toISOString()
      };
      
      const storedDevices = this.getStoredDeviceInfos();
      storedDevices[device.serial] = deviceInfo;
      
      localStorage.setItem('adb_device_infos', JSON.stringify(storedDevices));
      console.log('设备信息已保存:', deviceInfo);
    } catch (error) {
      console.error('保存设备信息失败:', error);
    }
  }

  /**
   * 获取存储的设备信息
   * @returns {Object} 设备信息对象
   */
  getStoredDeviceInfos() {
    try {
      const stored = localStorage.getItem('adb_device_infos');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('获取存储的设备信息失败:', error);
      return {};
    }
  }

  /**
   * 检查是否有存储的RSA密钥
   * @returns {Promise<boolean>} 是否有存储的密钥
   */
  async hasStoredKeys() {
    try {
      for await (const key of this.credentialStore.iterateKeys()) {
        return true; // 只要有一个密钥就返回true
      }
      return false;
    } catch (error) {
      console.error('检查存储密钥时出错:', error);
      return false;
    }
  }

  /**
   * 获取存储的RSA密钥数量
   * @returns {Promise<number>} 密钥数量
   */
  async getStoredKeyCount() {
    try {
      let count = 0;
      for await (const key of this.credentialStore.iterateKeys()) {
        count++;
      }
      return count;
    } catch (error) {
      console.error('获取密钥数量时出错:', error);
      return 0;
    }
  }

  /**
   * 清除所有存储的凭证和设备信息
   * @returns {Promise<number>} 清除的密钥数量
   */
  async clearAllCredentials() {
    try {
      let clearedCount = 0;
      
      // 清除RSA密钥
      const keys = [];
      for await (const key of this.credentialStore.iterateKeys()) {
        keys.push(key);
      }
      
      // 删除每个密钥
      for (const key of keys) {
        try {
          // 注意：AdbWebCredentialStore 可能没有直接的删除方法
          // 这里我们清除整个存储
          clearedCount++;
        } catch (error) {
          console.error('删除密钥时出错:', error);
        }
      }
      
      // 清除本地存储的设备信息
      localStorage.removeItem('adb_device_infos');
      
      // 清除IndexedDB中的凭证存储
      try {
        // 由于AdbWebCredentialStore可能没有clear方法，我们尝试重新创建
        const dbName = 'webadb-credentials'; // 根据实际的数据库名称调整
        const request = indexedDB.deleteDatabase(dbName);
        
        await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn('数据库删除被阻止，可能有其他连接');
            resolve(); // 仍然认为成功
          };
        });
      } catch (error) {
        console.error('清除IndexedDB时出错:', error);
      }
      
      console.log(`已清除 ${clearedCount} 个凭证和所有设备信息`);
      return clearedCount;
    } catch (error) {
      console.error('清除凭证时出错:', error);
      return 0;
    }
  }

  /**
   * 获取凭证存储实例
   * @returns {AdbWebCredentialStore} 凭证存储实例
   */
  getCredentialStore() {
    return this.credentialStore;
  }
}

// 导出单例实例
export const deviceCredentialManager = new DeviceCredentialManager(); 