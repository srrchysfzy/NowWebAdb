# 📱 NowWebAdb
【[中文文档](./README-CN.md)】 | 【[English Document](./README.md)】

NowWebAdb 是一个基于 Web 的 Android 设备管理工具，使用开源库 [ya-webadb](https://github.com/yume-chan/ya-webadb) 实现。它允许用户通过 Web 界面管理和交互本地的 Android 设备，提供各种设备信息检索和管理功能。

## 🔥 最新更新

- **全面界面重构** 🎨
  - 新的分屏布局，左侧设备屏幕，右侧功能区
  - 基于标签页的导航，无缝切换各项功能
  - 增强的设备状态栏，实时显示设备信息

- **改进的设备仪表盘** 📊
  - 详细的设备信息卡片，包括系统、硬件、电池、存储和网络信息
  - 实时性能图表，监控 CPU 和内存使用情况
  - 增强的错误处理和连接状态管理

- **增强的屏幕镜像** 📱
  - 改进的连接稳定性和错误恢复机制
  - 重新设计的设备控制按钮，提升使用体验
  - 连接过程中的加载屏幕和状态指示器

## 🌟 功能概览

- **设备信息检索** 📊
    - 查看 Android 设备的基本信息，包括：
        - 当前屏幕截图
        - 设备温度
        - 电池状态
        - Wi-Fi 连接信息
        - IP 地址
        - 系统版本
        - 屏幕大小
        - ABI 架构
        - 内存和存储使用情况
        - 序列号
        - CPU 信息等

- **文件管理** 📁
    - 提供设备上的文件管理操作，包括：
        - 创建文件夹
        - 上传文件
        - 下载文件
        - 重命名文件
        - 删除文件
        - 查看详细文件信息

- **终端操作** 💻
    - 直接发送 Shell 命令进行终端操作
    - 优化的终端显示界面，提供更好的用户体验

- **屏幕控制** 🖱️
    - 支持从 Web 界面直接控制设备屏幕操作，包括：
        - 滑动
        - 鼠标滚轮操作
        - 键盘输入

- **性能监控** 📈
    - 实时监控设备性能指标：
        - CPU 使用率
        - 内存消耗
        - FPS（每秒帧数）
        - 网络流量
        - 电池电量和温度
    - 可自定义数据采集间隔和上限
    - 导出性能数据报告

- **实时日志查看** 📋
    - 实时查看和过滤设备日志
    - 增强的日志显示，支持颜色编码和过滤选项

- **未来功能** 🛠️
    - 应用管理
    - 截图功能等

## 🛠️ 技术栈

- **前端框架**：Vue 3
- **状态管理**：Vuex
- **路由管理**：Vue Router
- **构建工具**：Vite
- **样式**：CSS/Sass
- **其他**：Element-Plus、BootStrap（UI 框架）

## 💻 环境要求

- **Node.js**：v16.x 或更高
- **npm**：v8.x 或更高
- **浏览器**：Chrome（Firefox 和其他浏览器不支持 WebUSB）

## 📂 项目结构

```plaintext
NowWebAdb
├── public
│   ├── icon.svg          # 网页图标
├── src
│   ├── assets            # 静态资源
│   ├── components        # 公共组件
│   │   ├── overview      # 设备概览组件
│   ├── layouts           # 布局
│   ├── pages             # 页面
│   ├── router            # 路由
│   ├── stores            # 状态管理
│   ├── utils             # 工具函数
│   │   ├── performance   # 性能监控工具
│   ├── App.vue           # 根组件
│   ├── auto-imports.d.ts # Vite 自动导入类型
│   ├── main.js           # 入口文件
├── .gitignore            # Git 忽略文件
├── index.html            # HTML 模板
├── LICENSE               # 许可证
├── package.json          # 项目依赖
├── README.md             # 项目文档
├── README-CN.md          # 项目文档（中文）
├── vite.config.js        # Vite 配置文件
```

## 🚀 快速开始
1. 克隆仓库：
    ```bash
    git clone https://github.com/srrchysfzy/NowWebAdb.git
    ```
2. 安装依赖：
    ```bash
    cd NowWebAdb
    npm install
    ```
3. 启动开发服务器：
    ```bash
    npm run dev
    ```
4. 在浏览器中打开 http://localhost:5173 查看结果。

## 📝 贡献
欢迎提交 Issues 和 Pull Requests 来帮助改进项目！😊

## 🎉 致谢
感谢以下开源项目和工具，使本项目成为可能：

* [ya-webadb](https://github.com/yume-chan/ya-webadb) - 用于管理 Android 设备的开源库。
* [Vue.js](https://vuejs.org) - 强大的前端框架。
* [Vite](https://vitejs.dev) - 快速的构建工具。
* [Element Plus](https://element-plus.org) - 丰富的 UI 组件。
* [BootStrap](https://getbootstrap.com) - CSS 框架。

## 📄 许可证
GPL-3.0

