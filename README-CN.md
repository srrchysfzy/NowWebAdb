# 📱 NowWebAdb
【[中文文档](./README-CN.md)】 | 【[English Document](./README.md)】

NowWebAdb 是一个基于 Web 的安卓设备管理工具，使用开源库 [ya-webadb](https://github.com/yume-chan/ya-webadb) 实现。它可以让用户在网页上对本地安卓设备进行操作，提供了多种设备信息查询和管理功能。

## 🌟 功能概览

- **设备信息获取** 📊
    - 查看安卓设备的基本信息，包括：
        - 设备当前画面截图
        - 设备温度信息
        - 电池状态
        - WiFi 连接信息
        - IP 地址
        - 系统版本
        - 屏幕尺寸
        - ABI 架构
        - 内存和存储使用情况
        - 序列号
        - CPU 信息等

- **文件管理** 📁
    - 提供设备文件的管理操作，包括：
        - 新建文件夹
        - 上传文件
        - 下载文件
        - 重命名文件
        - 删除文件
        - 查看文件详细信息

- **终端操作** 💻
    - 可以直接发送 Shell 命令，进行终端操作。

- **屏幕控制** 🖱️
    - 支持在网页上直接控制设备屏幕操作，包括：
        - 滑动
        - 鼠标滚轮操作
        - 键盘输入

- **未来功能** 🛠️
    - 应用管理
    - 实时日志查看
    - 截图功能等
## 🛠️ 技术栈

- **前端框架**：Vue 3
- **状态管理**：Vuex
- **路由管理**：Vue Router
- **构建工具**：Vite
- **样式**：CSS/Sass
- **其他**：Element-Plus、BootStrap (UI框架)

## 💻 环境要求

- **Node.js**：v16.x 或更高
- **npm**：v8.x 或更高
- **浏览器**：chrome (firefox等浏览器不支持webusb)

## 📂 项目结构

```plaintext
NowWebAdb
├── public
│   ├── icon.svg          # 网页图标
├── src
│   ├── assets            # 静态资源
│   ├── components        # 公共组件
│   ├── layouts           # 布局
│   ├── pages             # 页面
│   ├── router            # 路由
│   ├── stores            # 状态管理
│   ├── App.vue           # 根组件
│   ├── auto-imports.d.ts # vite 自动导入类型
│   ├── main.js           # 入口文件
├── .gitignore            # git忽略文件
├── index.html            # HTML模板
├── LICENSE               # 许可证
├── package.json          # 项目依赖
├── README.md             # 项目说明 (英语版)
├── README-CN.md          # 项目说明 (中文版)
├── vite.config.js        # vite 配置文件
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
4. 在浏览器中打开 http://localhost:5173 查看效果。

## 📝 贡献
欢迎提交 Issue 和 Pull Request 来帮助改进项目！😊
## 🎉 鸣谢
感谢以下开源项目和工具，使本项目得以顺利进行：

* [ya-webadb](https://github.com/yume-chan/ya-webadb) - 用于操作安卓设备的开源库。
* [Vue.js](https://vuejs.org) - 提供强大的前端框架。
* [Vite](https://vitejs.dev) - 提供快速的构建工具。
* [Element Plus](https://element-plus.org) - 提供丰富的 UI 组件。
* [BootStrap](https://getbootstrap.com) - 提供 CSS 框架。
## 📄 许可证
GPL-3.0

