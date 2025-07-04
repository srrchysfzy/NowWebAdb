<template>
  <div class="mx-4">
    <div class="d-flex justify-content-between">
      <el-space>
        <el-input v-model="searchPackage" :style="{width: width - 180 + 'px'}" placeholder="请输入名称或包名进行搜索">
          <template #prefix>
            <span>🔍</span>
          </template>
        </el-input>
      </el-space>
      <el-space>
        <el-button type="primary" @click="getAppIcon">初始化</el-button>
      </el-space>
    </div>


    <el-space class="mt-4" :size="40">
      <el-space style="cursor: pointer" @click="uninstallApp">
        <SvgIcon icon="packageDelete"/>
        <span>卸载</span>
      </el-space>
      <el-space style="cursor: pointer" @click="backupApp">
        <SvgIcon icon="packageSave"/>
        <span>备份</span>
      </el-space>
      <el-space style="cursor: pointer" @click="exportApk">
        <SvgIcon icon="packageExport"/>
        <span>导出Apk</span>
      </el-space>
      <el-space style="cursor: pointer" @click="showAppDetails">
        <SvgIcon icon="packageInfo"/>
        <span>详细信息</span>
      </el-space>
    </el-space>
    <div class="card mt-4">
      <div class="card-header">
        <el-row :gutter="10">
          <el-col :span="10">
            <el-space>
              <el-icon v-if="selectStatus === 0" style="margin-right: 50px;margin-left: 10px;cursor: pointer" :size="20"
                       @click="handleSelectAll">
                <CircleCheck/>
              </el-icon>
              <el-icon v-if="selectStatus === 2 || selectStatus === 3"
                       style="margin-right: 50px;margin-left: 10px;cursor: pointer" :size="20"
                       color="#409EFF" @click="handleSelectAll">
                <RemoveFilled/>
              </el-icon>
              <el-icon v-if="selectStatus === 1" style="margin-right: 50px;margin-left: 10px;cursor: pointer" :size="20"
                       color="#409EFF" @click="handleSelectAll">
                <CircleCheckFilled/>
              </el-icon>

              <span>名称</span>
              <el-icon v-if="sortType === 'desc'" :size="18" style="cursor: pointer" @click="sortFileList('asc')">
                <Bottom/>
              </el-icon>
              <el-icon v-else :size="18" style="cursor: pointer;margin-top: 3px" @click="sortFileList('desc')">
                <Top/>
              </el-icon>
            </el-space>
          </el-col>
          <el-col :span="14">
            <span style="margin-right: 45px">来源</span>
            <span>大小</span>
            <div style="margin-left: 160px; margin-top: -24px" class="d-flex justify-content-between">
              <span>安装时间</span>
              <span>最后使用时间</span>
              <span style="margin-right: 15px">操作</span>
            </div>
          </el-col>
        </el-row>
      </div>
      <el-scrollbar :style="{height: height-250 + 'px'}">
        <div class="card-body">
          <div v-if="appItemList.length > 0">

            <el-row
                v-for="(appItem, index) in appItemList"
                :key="index" class="fileItemCss"
                :style="appItem.isSelect?{backgroundColor: '#d1dbf5'}:''"
                :gutter="10"
                style="margin-left: -16px; margin-right: -16px" @click="getCurrentAppItem(appItem)">
              <el-col :span="10">
                <el-space>
                  <div v-if="appItem.isSelect" @click.stop="handelSelectItem(appItem)"
                       style="margin-right: 14px;margin-left: 21px;margin-top: -3px">
                    <SvgIcon icon="RoundCheckIcon" color="#409EFF"/>
                  </div>
                  <div v-else class="hidden-icon" @click.stop="handelSelectItem(appItem)">
                    <SvgIcon icon="RoundIcon"/>
                  </div>
                  <el-image v-if="appItem.IconBase64 === 'data:image/png;base64,' || appItem.IconBase64 === ''"
                            :src="androidPack" :style="{width: 40 + 'px', height: 40 + 'px', borderRadius: 12 +'px'}"
                            fit="fill"/>
                  <el-image v-else :src="appItem.IconBase64"
                            :style="{width: 40 + 'px', height: 40 + 'px', borderRadius: 12 +'px'}" fit="fill"/>
                  <!--                <el-avatar shape="square" :size="40" :src="appItem.IconBase64" />-->
                  <span class="fileNameCss">{{ appItem.appName }}</span>
                </el-space>
              </el-col>
              <el-col :span="14">
                <div style="margin-top: 8px">
                  <span>{{ appItem.appSource }}</span>
                </div>
                <div style="margin-left: 90px;margin-top: -25px">
                  <span v-if="appItem.numType === 8">{{ appItem.size }}</span>
                  <span v-else>--</span>
                </div>
                <div style="margin-left: 160px; margin-top: -20px" class="d-flex justify-content-between">
                  <span>{{ appItem.createTime }}</span>
                  <span>{{ appItem.modifyTime }}</span>
                  <el-popover
                      placement="right"
                      trigger="click"
                      width="170"
                      :popper-style="{padding: 7 + 'px'}"
                  >
                    <template #reference>
                      <el-icon style="margin-right: 32px; margin-left: 9px;" :size="18" @click.stop>
                        <More/>
                      </el-icon>
                    </template>
                    <template #default>
                      <el-space class="operationItemCss" @click="rightDownloadFile(appItem.name, appItem.numType)">
                        <SvgIcon style="margin-left: 9px" icon="DownloadIcon"/>
                        <span class="mx-2">在设备上启动</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="renameFile(appItem.name)">
                        <SvgIcon style="margin-left: 9px" icon="RenameIcon"/>
                        <span class="mx-2">卸载</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="deleteFileSingle(appItem.name, appItem.numType)">
                        <SvgIcon style="margin-left: 9px" icon="DeleteIcon"/>
                        <span class="mx-2">备份</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="getFileDetail(appItem.name)">
                        <SvgIcon style="margin-left: 12px" icon="InfoIcon"
                                 :style="{ width:18 + 'px', height: 18 + 'px'}"/>
                        <span style="margin-left: 9px">导出Apk</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="deleteFileSingle(appItem.name, appItem.numType)">
                        <SvgIcon style="margin-left: 9px" icon="DeleteIcon"/>
                        <span class="mx-2">详细信息</span>
                      </el-space>
                    </template>
                  </el-popover>
                </div>
              </el-col>
            </el-row>
          </div>
          <el-empty v-else description="暂无文件"/>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import {PackageManager} from "@yume-chan/android-bin";
import {TextDecoderStream, WritableStream} from "@yume-chan/stream-extra";
import {Bottom, CircleCheck, CircleCheckFilled, More, RemoveFilled, Search, Top} from '@element-plus/icons-vue'
import {getAdbInstance} from "@/utils/adbManager.js";
import SvgIcon from "@/components/SvgIcon.vue";
import useWindowResize from "@/utils/useWindowResize.js";
import androidPack from '@/assets/img/androidPack.png';
import {pushServerAndStartScrcpyClient} from "@/utils/adbUtils.js";

const {width, height} = useWindowResize()
const searchPackage = ref("");
const selectStatus = ref(0);
const sortType = ref("desc");
const appItemList = ref([])
let socket;
let writer;
const appList = ref([])
const appInfoList = ref([])

const handleSelectAll = () => {
  console.log('全选')
  if (selectStatus.value === 0) {
    appItemList.value.forEach((appItem) => {
      appItem.isSelect = true
    })
  } else {
    appItemList.value.forEach((appItem) => {
      appItem.isSelect = false
    })
  }
}

// 应用操作功能
const uninstallApp = () => {
  ElMessage.info('卸载功能开发中')
}

const backupApp = () => {
  ElMessage.info('备份功能开发中')
}

const exportApk = () => {
  ElMessage.info('导出APK功能开发中')
}

const showAppDetails = () => {
  ElMessage.info('查看应用详情功能开发中')
}

const testReadAppInfo = async () => {
  let adb = await getAdbInstance();
  let isServiceRunning = false
  console.log("检测服务是否开启")
  
  let process;
  if (adb.subprocess.shellProtocol?.isSupported) {
    process = await adb.subprocess.shellProtocol.spawn("top -b -n 1 | grep app_process");
  } else {
    process = await adb.subprocess.noneProtocol.spawn("top -b -n 1 | grep app_process");
  }
  
  await process.stdout.pipeThrough(new TextDecoderStream()).pipeTo(
      new WritableStream({
        write(chunk) {
          if (chunk.includes("com.lyx.myapplication.Main")) {
            isServiceRunning = true
            console.log("服务已开启，无需额外启动")
          }
        },
      }),
  );
  if (!isServiceRunning) {
    console.log("服务未开启，尝试开启服务")
    console.log("准备推送apkans.jar")
    await pushServerAndStartScrcpyClient(adb, '/apkans.jar', false)
    
    if (adb.subprocess.shellProtocol?.isSupported) {
      await adb.subprocess.shellProtocol.spawn(
          "CLASSPATH=/data/local/tmp/apkans.jar nohup app_process / com.lyx.myapplication.Main > /dev/null 2>&1 &"
      );
    } else {
      await adb.subprocess.noneProtocol.spawn(
          "CLASSPATH=/data/local/tmp/apkans.jar nohup app_process / com.lyx.myapplication.Main > /dev/null 2>&1 &"
      );
    }
    
    let checkProcess;
    if (adb.subprocess.shellProtocol?.isSupported) {
      checkProcess = await adb.subprocess.shellProtocol.spawn("top -b -n 1 | grep app_process");
    } else {
      checkProcess = await adb.subprocess.noneProtocol.spawn("top -b -n 1 | grep app_process");
    }
    
    await checkProcess.stdout.pipeThrough(new TextDecoderStream()).pipeTo(
        new WritableStream({
          write(chunk) {
            if (chunk.includes("com.lyx.myapplication.Main")) {
              console.log("当前服务已开启")
            }
          },
        }),
    );
  }
};

// 客户端开启socket连接
const testSocket = async () => {
  console.log("开启socket连接");
  const maxRetries = 5; // 最大重试次数
  const retryInterval = 1000; // 重试间隔时间（毫秒）

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let adb = await getAdbInstance();
      // 创建与 Android 设备端口的套接字连接
      socket = await adb.createSocket("tcp:4521");
      console.log("socket连接成功");
      const decoder = new TextDecoder("utf-8");

      let currentAppInfo = '';

      await socket.readable.pipeTo(
          new WritableStream({
            write(chunk) {
              const decodedChunk = decoder.decode(chunk);
              if (decodedChunk.startsWith("appName: ")) {
                if (currentAppInfo) {
                  appInfoList.value.push(currentAppInfo);
                  currentAppInfo = '';
                }
                currentAppInfo = decodedChunk;
              } else {
                currentAppInfo += decodedChunk;
              }
            },
            close() {
              if (currentAppInfo) {
                appInfoList.value.push(currentAppInfo);
              }
            }
          })
      );
      return; // 成功连接后退出循环
    } catch (error) {
      console.error(`尝试 ${attempt} 次创建socket失败:`, error);
      if (attempt < maxRetries) {
        console.log(`将在 ${retryInterval / 1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } else {
        console.error("达到最大重试次数，放弃连接");
        throw error; // 达到最大重试次数后抛出异常
      }
    }
  }
}


const testAppInfoList = async () => {
  appInfoList.value.forEach((item, index) => {
    const parts = item.split('iconBase64:');
    const appInfo = {};

    // 处理非 IconBase64 部分
    const lines = parts[0].split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      const [key, value] = line.split(': ').map(part => part.trim());
      appInfo[key] = value;
    });

    // 处理 IconBase64 部分
    if (parts.length > 1) {
      appInfo.IconBase64 = parts[1].trim();
    }

    appItemList.value.push(appInfo);
  });
  appList.value.forEach(item => {
    appItemList.value.forEach(item2 => {
      if (item.packageName === item2.packageName) {
        // 将item的内容合并到item2
        Object.assign(item2, item);
        if (item2.sourceDir.startsWith('/data/app/')) {
          item2.appSource = '本地应用';
        } else if (item.sourceDir.startsWith('/system')) {
          item2.appSource = '系统应用';
        } else {
          item2.appSource = '未知';
        }
      }
    })
  })

  console.log(appItemList.value);
  socket.close();
}

const sendPackage = async (path) => {
  writer = socket.writable.getWriter();
  console.log("测试发送消息");
  await writer.write(new TextEncoder().encode(path));
  await writer.write(new TextEncoder().encode("\r"));
  console.log("数据发送成功");
  writer.releaseLock();
}
const getCurrentAppItem = (name) => {
  console.log(name)
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const initPmObj = async (isShowThirdParty = true) => {
  console.log("初始化应用管理器");
  let adb = await getAdbInstance();
  const pm = new PackageManager(adb);
  const options = {
    showSourceDir: true,
    showVersionCode: true,
    showInstaller: true,
    listThirdParty: isShowThirdParty
  };
  const packageList = pm.listPackages(options);
  console.log("通过应用管理器获取简单列表")
  await testReadAppInfo()

  for await (const packages of packageList) {
    console.log(packages);
    console.log("Package Name:", packages.packageName);
    console.log("Source sourceDir:", packages.sourceDir || "Unknown");
    console.log("Version Code:", packages.versionCode || "Unknown");
    console.log("Installer:", packages.installer || "Unknown");
    console.log("UID:", packages.uid || "Unknown");
    console.log("---------------------");
    appList.value.push({
      packageName: packages.packageName,
      versionCode: packages.versionCode,
      sourceDir: packages.sourceDir,
      installer: packages.installer,
      isSelect: false
    });
  }
  console.log("所有app的数量", appList.value.length);
  await testSocket()
};
const getAppIcon = async () => {
  for (let i = 0; i < appList.value.length; i++) {
    console.log("发送第", i, "条消息", appList.value[i].sourceDir);
    await sendPackage(appList.value[i].sourceDir);
    // 发送完一条消息后等待500毫秒再发送下一条
    await delay(100);
  }
  await testAppInfoList()
};
onMounted(() => {
  initPmObj();
})
</script>

<style scoped>
.fileItemCss {
  cursor: pointer;
  height: 50px;
  transition: background-color 0.3s;
  align-content: center;

  &:hover {
    background-color: #dedfe0;
  }
}

/* 新增规则：隐藏 SvgIcon 默认不可见 */
.hidden-icon {
  margin-right: 14px;
  margin-left: 21px;
  margin-top: -3px;
  opacity: 0;
  transition: opacity 0.3s; /* 添加过渡效果 */
}

/* 新增规则：在 fileItemCss 悬停时显示 .hidden-icon */
.fileItemCss:hover .hidden-icon {
  opacity: 1; /* 完全可见 */
}

.operationItemCss {
  cursor: pointer;
  height: 40px;
  width: 154px;
  border-radius: 6px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #dedfe0;
  }
}
</style>