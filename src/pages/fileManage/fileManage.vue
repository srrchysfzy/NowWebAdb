<template>
  <div class="mx-4 mt-2">
    <div class="d-flex justify-content-between">
      <el-space>
        <div style="margin-top: -5px;cursor: pointer" @click="handleBackParent">
          <SvgIcon icon="BackIcon" :color="'#66b1ff'" style="margin-right: 10px;"/>
        </div>
        <SvgIcon icon="StorageIcon" :color="'#333333'"/>
        <el-space v-for="(dirName, index) in dirNameList" :key="index">
          <el-icon>
            <ArrowRight/>
          </el-icon>
          <span
            :class="nowDir===dirName?'fw-bold':''"
            style="cursor: pointer"
            :style="nowDir===dirName?{color: '#66b1ff'}:''" @click="handleBackPath(index)">
            {{ dirName }}
          </span>
        </el-space>
      </el-space>
      <el-space>
        <el-icon style="cursor: pointer" :size="20">
          <Search/>
        </el-icon>
        <el-icon style="cursor: pointer" :size="20" class="mx-2" @click="getFileList('')">
          <Refresh/>
        </el-icon>
        <el-popover
          placement="bottom"
          trigger="click"
          :popper-style="{padding: 7 + 'px'}"
        >
          <template #reference>
            <el-icon style="cursor: pointer" :size="20">
              <More/>
            </el-icon>
          </template>
          <template #default>
            <el-space class="operationItemCss" @click="copyPath">
              <SvgIcon style="margin-left: 9px" icon="CopyIcon"/>
              <span class="mx-2">复制路径</span>
            </el-space>
            <el-space class="operationItemCss" @click="jumpPath">
              <SvgIcon style="margin-left: 9px" icon="JumpIcon"/>
              <span class="mx-2">跳转目录</span>
            </el-space>
            <el-space class="operationItemCss" @click="handleBackPath(0)">
              <SvgIcon
                style="margin-left: 11px;transform: rotate(180deg)"
                :style="{ width:18 + 'px', height: 18 + 'px'}"
                icon="BackRootIcon"/>
              <span style="margin-left: 11px">回到根目录</span>
            </el-space>
          </template>
        </el-popover>
      </el-space>
    </div>
    <el-space class="mt-4" :size="40">
      <el-space style="cursor: pointer" @click="createNewFolder">
        <SvgIcon icon="NewFolderIcon"/>
        <span>新建文件夹</span>
      </el-space>
      <el-upload ref="upFileRef" style="margin-bottom: -5px" :auto-upload="false" :show-file-list="false"
                 :on-change="handleUploadFile">
        <template #trigger>
          <el-space style="cursor: pointer;">
            <SvgIcon icon="UploadFileIcon"/>
            <span>上传文件</span>
          </el-space>
        </template>
      </el-upload>
      <el-space
        :style="selectStatus === 3 || selectStatus === 2 || selectStatus === 1?{cursor: 'pointer'}:{color: '#a8a8a8',cursor: 'not-allowed'}" @click="topDownloadFile">
        <SvgIcon icon="DownloadIcon"/>
        <span>下载</span>
      </el-space>
      <el-space :style="selectStatus === 3?{cursor: 'pointer'}:{color: '#a8a8a8',cursor: 'not-allowed'}"
                @click="topRenameFile">
        <SvgIcon icon="RenameIcon"/>
        <span>重命名</span>
      </el-space>
      <el-space
        :style="selectStatus === 3 || selectStatus === 2 || selectStatus === 1?{cursor: 'pointer'}:{color: '#a8a8a8',cursor: 'not-allowed'}"
        @click="topDeleteFile">
        <SvgIcon icon="DeleteIcon"/>
        <span>删除</span>
      </el-space>
      <el-space :style="selectStatus === 3?{cursor: 'pointer'}:{color: '#a8a8a8',cursor: 'not-allowed'}"
                @click="topGetFileDetail">
        <SvgIcon icon="InfoIcon" :style="{ width:18 + 'px', height: 18 + 'px'}"/>
        <span>详细信息</span>
      </el-space>
    </el-space>
    <div class="card mt-4">
      <div class="card-header">
        <el-row :gutter="10">
          <el-col :span="12">
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
              <el-icon :size="18" style="cursor: pointer">
                <Bottom/>
              </el-icon>
            </el-space>
          </el-col>
          <el-col :span="12">
            <span>大小</span>
            <div style="margin-left: 100px; margin-top: -24px" class="d-flex justify-content-between">
              <span>修改时间</span>
              <span>创建时间</span>
              <span style="margin-right: 15px">操作</span>
            </div>
          </el-col>
        </el-row>
      </div>
      <el-scrollbar :style="{height: height-250 + 'px'}">
        <div class="card-body">
          <div v-if="fileItemList.length > 0">
            
            <el-row
              v-for="(fileItem, index) in fileItemList"
              :key="index" class="fileItemCss"
              :style="fileItem.isSelect?{backgroundColor: '#d1dbf5'}:''"
              :gutter="10"
              style="margin-left: -16px; margin-right: -16px"
              @click="getFileList(fileItem.name)">
              <el-col :span="12">
                <el-space>
                  <div v-if="fileItem.isSelect" @click.stop="handelSelectItem(fileItem)"
                       style="margin-right: 14px;margin-left: 21px;margin-top: -3px">
                    <SvgIcon icon="RoundCheckIcon" color="#409EFF"/>
                  </div>
                  <div v-else class="hidden-icon" @click.stop="handelSelectItem(fileItem)">
                    <SvgIcon icon="RoundIcon"/>
                  </div>
                  <SvgIcon v-if="fileItem.type === ''" icon="FileTypeFolderIcon" style="margin-left: 8px"/>
                  <SvgIcon v-else-if="imgType.includes(fileItem.type)" icon="FileTypeImgIcon" style="margin-left: 8px"/>
                  <SvgIcon v-else-if="videoType.includes(fileItem.type)" icon="FileTypeVideoIcon"
                           style="margin-left: 8px"/>
                  <SvgIcon v-else-if="audioType.includes(fileItem.type)" icon="FileTypeAudioIcon"
                           style="margin-left: 8px"/>
                  <SvgIcon v-else-if="textType.includes(fileItem.type)" icon="FileTypeTextIcon"
                           style="margin-left: 8px"/>
                  <SvgIcon v-else icon="FileTypeNoneIcon" style="margin-left: 8px"/>
                  <span class="fileNameCss">{{ fileItem.name }}</span>
                </el-space>
              </el-col>
              <el-col :span="12">
                <span v-if="fileItem.numType === 8">{{ formatSize(fileItem.size) }}</span>
                <span v-else>--</span>
                <div style="margin-left: 100px; margin-top: -24px" class="d-flex justify-content-between">
                  <span>{{ fileItem.createTime }}</span>
                  <span>{{ fileItem.modifyTime }}</span>
                  <el-popover
                    placement="right"
                    trigger="click"
                    :popper-style="{padding: 7 + 'px'}"
                  >
                    <template #reference>
                      <el-icon style="margin-right: 32px; margin-left: 9px;margin-top: 3px" :size="18" @click.stop>
                        <More/>
                      </el-icon>
                    </template>
                    <template #default>
                      <el-space class="operationItemCss" @click="downloadFile(fileItem.name)">
                        <SvgIcon style="margin-left: 9px" icon="DownloadIcon"/>
                        <span class="mx-2">下载</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="renameFile(fileItem.name)">
                        <SvgIcon style="margin-left: 9px" icon="RenameIcon"/>
                        <span class="mx-2">重命名</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="deleteFileSingle(fileItem.name, fileItem.numType)">
                        <SvgIcon style="margin-left: 9px" icon="DeleteIcon"/>
                        <span class="mx-2">删除</span>
                      </el-space>
                      <el-space class="operationItemCss" @click="getFileDetail(fileItem.name)">
                        <SvgIcon style="margin-left: 12px" icon="InfoIcon"
                                 :style="{ width:18 + 'px', height: 18 + 'px'}"/>
                        <span style="margin-left: 9px">详细信息</span>
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
  <FileDetailDrawer ref="fileDetailDrawerRef"/>
</template>
<script setup>
import {
  ArrowRight,
  Bottom,
  CircleCheck,
  CircleCheckFilled,
  More,
  Refresh,
  RemoveFilled,
  Search,
} from "@element-plus/icons-vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {getAdbInstance, executeCommand, formatSize} from "@/assets/js/adbManager.js";
import useWindowResize from "@/assets/js/useWindowResize.js";
import FileDetailDrawer from "@/pages/fileManage/fileDetailDrawer.vue";
import {Consumable} from "@yume-chan/stream-extra";
import {encodeUtf8} from "@yume-chan/adb";

let syncObject
let imgType = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'psd', 'raw', 'heif']
let videoType = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'rmvb', 'mkv', 'webm', 'mpg', 'mpeg', '3gp']
let audioType = ['mp3', 'wav', 'wma', 'flac', 'aac', 'ape', 'ogg', 'm4a', 'amr', 'mid']
let textType = ['txt', 'md', 'log']

const {width, height} = useWindowResize()
const dirPathName = ref('/sdcard')
const fileItemList = ref([])
const fileDetailDrawerRef = ref(null)
const upFileRef = ref(null)
const nowFileInfo = ref({})

const nowDir = computed(() => {
  // 先判断路径是不是只有'/'，如果不是则用'/'切割路径字符串，获取最后一个元素
  if (dirPathName.value === '/') {
    return '根目录'
  } else {
    return dirPathName.value.split('/').filter(item => item !== '').pop()
  }
})
const selectStatus = computed(() => {
  if (fileItemList.value.length === 0) {
    return 0;
  }
  // 检查是否所有对象的 isSelect 值都为 true
  const allTrue = fileItemList.value.every(obj => obj.isSelect === true);
  
  // 检查是否至少有一个对象的 isSelect 值为 true
  const hasTrue = fileItemList.value.some(obj => obj.isSelect === true);
  
  // 检查是否只有一个对象的 isSelect 值为 true
  const onlyOneTrue = fileItemList.value.filter(obj => obj.isSelect === true).length === 1;
  
  if (allTrue) {
    return 1;
  } else if (onlyOneTrue) {
    return 3;
  } else if (hasTrue) {
    return 2;
  } else {
    return 0;
  }
})
const dirNameList = computed(() => {
  if (dirPathName.value === '/') {
    return ['根目录']
  } else {
    return ['根目录', ...dirPathName.value.split('/').filter(item => item !== '')]
  }
})
const getFileList = async (filePath) => {
  fileItemList.value = []
  let nowDirPath = dirPathName.value
  if (filePath) {
    nowDirPath = dirPathName.value + '/' + filePath
  }
  syncObject = await getAdbInstance().sync()
  console.log(filePath)
  // 在获取前先判断是否为文件夹
  const isDirectory = await syncObject.isDirectory(nowDirPath)
  if (isDirectory) {
    dirPathName.value = nowDirPath
  } else {
    console.log('不是文件夹')
  }
  let num = 0
  for await (const entry of syncObject.opendir(dirPathName.value)) {
    if (entry.name === '.' || entry.name === '..') {
      continue
    }
    num++
    fileItemList.value.push({
      id: num,
      name: entry.name,
      size: entry.size,
      createTime: timestampToTime(entry.ctime),
      modifyTime: timestampToTime(entry.mtime),
      isSelect: false,
      numType: entry.type,
      type: entry.type === 8 ? entry.name.split('.').pop() : '' // 8是文件，其他是文件夹
    })
  }
}
// 将类似这种1533657660n的bigint转换为xxxx-xx-xx xx:xx:xx格式
const timestampToTime = (bigIntValue) => {
  // 转换为毫秒级别的时间戳
  const timestamp = Number(bigIntValue) * 1000;
  // 创建一个Date对象
  const date = new Date(timestamp);
  // 获取年、月、日、小时、分钟、秒
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  // 格式化为字符串
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// 根据点击的文件夹名字返回到指定路径
const handleBackPath = (index) => {
  console.log('点击路径')
  if (index === 0) {
    dirPathName.value = '/'
  } else {
    const dirNameList = dirPathName.value.split('/').filter(item => item !== '')
    dirPathName.value = '/' + dirNameList.slice(0, index).join('/')
  }
  getFileList('')
}
// 返回上一级目录
const handleBackParent = () => {
  console.log('返回上一级目录')
  if (dirPathName.value === '/') {
    ElNotification({
      title: '提示',
      message: '已经是根目录了',
      type: 'warning'
    })
    return
  }
  const dirNameList = dirPathName.value.split('/').filter(item => item !== '')
  dirPathName.value = '/' + dirNameList.slice(0, dirNameList.length - 1).join('/')
  getFileList('')
}
const handelSelectItem = (item) => {
  console.log('选中点击文件夹', selectStatus.value)
  fileItemList.value.forEach((fileItem) => {
    if (fileItem.id === item.id) {
      fileItem.isSelect = !fileItem.isSelect
    }
  })
}
const handleSelectAll = () => {
  console.log('全选')
  if (selectStatus.value === 0) {
    fileItemList.value.forEach((fileItem) => {
      fileItem.isSelect = true
    })
  } else {
    fileItemList.value.forEach((fileItem) => {
      fileItem.isSelect = false
    })
  }
}
const topGetFileDetail = async () => {
  if (selectStatus.value === 3) {
    fileItemList.value.forEach((fileItem) => {
      if (fileItem.isSelect) {
        getFileDetail(fileItem.name)
      }
    })
  }
}
const getFileDetail = async (fileName) => {
  console.log('获取文件详细信息')
  // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
  dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
  let nowDirPath
  if (dirPathName.value === '/') {
    nowDirPath = dirPathName.value + fileName
  } else {
    nowDirPath = dirPathName.value + '/' + fileName
  }
  console.log(nowDirPath)
  const res = await executeCommand(`stat '${nowDirPath}'`)
  const accessRegex = /Access:\s*\(([^)]*)\)/;
  const gidRegex = /Gid:\s*\(\s*\d+\/([^)]*)\)/;
  
  const accessMatch = res.match(accessRegex);
  const gidMatch = res.match(gidRegex);
  
  const accessValue = accessMatch ? accessMatch[1] : null;
  const gidValue = gidMatch ? gidMatch[1] : null;
  
  const stat = await syncObject.stat(nowDirPath);
  nowFileInfo.value = {
    name: fileName,
    path: dirPathName.value,
    size: stat.size,
    createTime: timestampToTime(stat.ctime),
    modifyTime: timestampToTime(stat.mtime),
    accessTime: timestampToTime(stat.atime),
    mode: stat.mode,
    uid: stat.uid,
    gid: stat.gid + (gidValue ? `(${gidValue})` : ''),
    type: stat.type,
    permissions: accessValue.replace('/', ' ')
  }
  fileDetailDrawerRef.value.openDrawer(nowFileInfo.value)
}
const copyPath = () => {
  console.log('复制路径')
  // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
  dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
  try {
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.value = dirPathName.value;
    document.body.appendChild(input);
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      ElNotification({
        title: '提示',
        message: '复制成功',
        type: 'success'
      });
    }).catch(() => {
      ElNotification({
        title: '错误',
        message: '复制失败',
        type: 'error'
      });
    }).finally(() => {
      document.body.removeChild(input);
    });
  } catch (error) {
    console.error('复制路径出错:', error);
    ElNotification({
      title: '错误',
      message: '复制路径出错',
      type: 'error'
    });
  }
}
const jumpPath = () => {
  console.log('跳转目录', dirPathName.value)
  // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
  dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
  // 弹出提示框，并将输入框默认值设置为当前路径
  ElMessageBox.prompt('请输入目录路径', '跳转目录', {
    inputValue: dirPathName.value,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.*/,
    inputErrorMessage: '请输入目录路径',
  }).then(({value}) => {
    console.log(value)
    // 点击确定按钮后，将输入框的值赋给当前路径
    dirPathName.value = value;
    // 获取当前路径下的文件列表
    getFileList('');
  }).catch(() => {
    console.log('取消跳转目录');
  });
}
const createNewFolder = () => {
  console.log('创建新文件夹')
  // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
  dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
  ElMessageBox.prompt('请输入文件夹名称', '创建新文件夹', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.*/,
    inputErrorMessage: '请输入文件夹名称',
  }).then(({value}) => {
    let creatPath = dirPathName.value === '/' ? '/' + value : dirPathName.value + '/' + value
    executeCommand('mkdir ' + creatPath).then((res) => {
      console.log('创建新文件夹', res)
      if (res) {
        if (res.includes('File exists') || res.includes('Read-only')) {
          ElNotification({
            title: '创建失败',
            message: res.split(':')[2],
            type: 'warning'
          });
          return
        }
      }
      ElNotification({
        title: '提示',
        message: '创建成功',
        type: 'success'
      });
      getFileList('')
    }).catch((err) => {
      console.log('创建新文件夹', err)
      ElNotification({
        title: '错误',
        message: '创建失败',
        type: 'error'
      });
    });
  });
}
const handleUploadFile = async (event, file, fileList) => {
  try {
    // 创建一个 FileReader 对象
    const reader = new FileReader();
    
    // 使用 Promise 包装文件读取操作，以便异步处理
    const readFile = () => {
      return new Promise((resolve, reject) => {
        // 设置文件读取完成时的回调函数
        reader.onload = (event) => {
          // 文件读取成功，将文件内容作为 resolve 的参数返回
          resolve(event.target.result);
        };
        
        // 设置文件读取出错时的回调函数
        reader.onerror = (error) => {
          // 文件读取失败，将错误作为 reject 的参数返回
          reject(error);
        };
        
        // 开始读取文件内容
        reader.readAsArrayBuffer(file[0].raw);
      });
    };
    
    // 读取文件内容(这里读取到的是 ArrayBuffer 类型，下面在读取流时需要将其转换为 Uint8Array 类型)
    const fileContent = await readFile();
    // 创建一个可读流，将文件内容传入
    const fileStream = new ReadableStream({
      start(controller) {
        // 在流开始时，将文件内容通过 controller.enqueue() 添加到可读流中
        controller.enqueue(new Consumable(new Uint8Array(fileContent)));
        // 文件内容添加完毕后，关闭可读流
        controller.close();
      },
    });
    // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
    dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
    // 将可读流传递给 sync.write() 函数，以写入到目标位置
    await syncObject.write({
      filename: dirPathName.value === '/' ? '/' + file[0].name : dirPathName.value + '/' + file[0].name,
      file: fileStream,
    });
  } catch (error) {
    // 处理文件读取或写入过程中的错误
    console.error('文件处理失败:', error);
  }
  upFileRef.value.clearFiles();
  await getFileList('')
}
const deleteFileSingle = async (fileName, type) => {
  // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
  dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
  console.log('删除文件', dirPathName.value === '/' ? '/' + fileName : dirPathName.value + '/' + fileName)
  // 弹出提示框
  ElMessageBox.confirm('是否删除文件/文件夹？', '删除文件', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    if (type === 8) {
      await getAdbInstance().rm(dirPathName.value === '/' ? '/' + fileName : dirPathName.value + '/' + fileName);
    } else {
      await getAdbInstance().rm(dirPathName.value === '/' ? '/' + fileName : dirPathName.value + '/' + fileName, {recursive: true});
    }
    ElNotification({
      title: '提示',
      message: '删除成功',
      type: 'success'
    });
    await getFileList('')
  }).catch(() => {
    console.log('取消删除文件');
  });
}
const topDeleteFile = async () => {
  ElMessageBox.confirm('是否删除选中的文件/文件夹？', '删除文件', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    for (let i = 0; i < fileItemList.value.length; i++) {
      if (fileItemList.value[i].isSelect) {
        if (fileItemList.value[i].type === 8) {
          await getAdbInstance().rm(dirPathName.value === '/' ? '/' + fileItemList.value[i].name : dirPathName.value + '/' + fileItemList.value[i].name);
        } else {
          await getAdbInstance().rm(dirPathName.value === '/' ? '/' + fileItemList.value[i].name : dirPathName.value + '/' + fileItemList.value[i].name, {recursive: true});
        }
      }
    }
    ElNotification({
      title: '提示',
      message: '删除成功',
      type: 'success'
    });
    await getFileList('')
  }).catch(() => {
    console.log('取消删除文件');
  });
}
const renameFile = async (fileName) => {
  ElMessageBox.prompt('请输入新的文件名', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.*/,
    inputValue: fileName,
    inputErrorMessage: '请输入文件名',
  }).then(async ({value}) => {
    if (value === '') {
      ElNotification({
        title: '提示',
        message: '文件名不能为空',
        type: 'warning'
      });
      return
    }
    if (fileName === value) {
      ElNotification({
        title: '提示',
        message: '文件名相同',
        type: 'warning'
      });
      return
    }
    if (fileName.indexOf('/') !== -1) {
      ElNotification({
        title: '提示',
        message: '文件名不能包含/',
        type: 'warning'
      });
      return
    }
    // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
    dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
    let originalPath = dirPathName.value === '/' ? '/' + fileName : dirPathName.value + '/' + fileName
    let renamePath = dirPathName.value === '/' ? '/' + value : dirPathName.value + '/' + value
    console.log('重命名文件', originalPath, renamePath)
    const res = await executeCommand(`mv ${originalPath} ${renamePath}`)
    if (res) {
      if (res.includes('File exists') || res.includes('Read-only')) {
        ElNotification({
          title: '创建失败',
          message: res.split(':')[2],
          type: 'warning'
        });
        return
      }
    }
    ElNotification({
      title: '提示',
      message: '重命名成功',
      type: 'success'
    });
    await getFileList('')
  });
}
const topRenameFile = async () => {
  if (selectStatus.value === 3) {
    for (const item of fileItemList.value) {
      if (item.isSelect) {
        await renameFile(item.name)
      }
    }
  }
}
const downloadFile = async (fileName) => {
  // 判断dirPathName.value头部是否有多余的'/'，如果有多余的'/'，只保留一个，如果没有则不变
  dirPathName.value = dirPathName.value.replace(/^\/{2,}/, '/');
  let readPath = dirPathName.value === '/' ? '/' + fileName : dirPathName.value + '/' + fileName
  console.log('下载文件地址', readPath)
  const connect = await syncObject.read(readPath);
  
  let chunks = [];
  const writableStream = new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    },
  });
  
  await connect.pipeTo(writableStream);
  
  // Combine all Uint8Arrays into one
  const combinedUint8Array = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    combinedUint8Array.set(chunk, offset);
    offset += chunk.byteLength;
  }
  
  // Create Blob from Uint8Array
  const blob = new Blob([combinedUint8Array]);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
const topDownloadFile = async () => {
  for (let i = 0; i < fileItemList.value.length; i++) {
    if (fileItemList.value[i].isSelect) {
      await downloadFile(fileItemList.value[i].name)
    }
  }
}


onMounted(() => {
  getFileList('')
})
onUnmounted(() => {
  console.log('销毁同步连接')
  syncObject?.dispose();
})
</script>

<style scoped>
.fileNameCss {
  cursor: pointer;
  transition: color 0.3s;
  
  &:hover {
    color: #409EFF;
  }
}

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
  width: 134px;
  border-radius: 6px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #dedfe0;
  }
}
</style>