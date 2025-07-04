# 📱 NowWebAdb
【[中文文档](./README-CN.md)】 | 【[English Document](./README.md)】

NowWebAdb is a web-based Android device management tool implemented using the open-source library [ya-webadb](https://github.com/yume-chan/ya-webadb). It allows users to manage and interact with local Android devices through a web interface, providing various features for device information retrieval and management.

## 🔥 Latest Updates

- **Comprehensive UI Redesign** 🎨
  - New split-screen layout with device screen on the left and features on the right
  - Tab-based navigation for seamless switching between functions
  - Enhanced device status bar with real-time information

- **Improved Device Dashboard** 📊
  - Detailed device information cards for system, hardware, battery, storage, and network
  - Real-time performance charts for CPU and memory monitoring
  - Enhanced error handling and connection state management

- **Enhanced Screen Mirroring** 📱
  - Improved connection stability and error recovery
  - Redesigned device control buttons for better usability
  - Loading screen with status indicators during connection

## 🌟 Feature Overview

- **Device Information Retrieval** 📊
    - View basic information about the Android device, including:
        - Current screen screenshot
        - Device temperature
        - Battery status
        - Wi-Fi connection information
        - IP address
        - System version
        - Screen size
        - ABI architecture
        - Memory and storage usage
        - Serial number
        - CPU information, etc.

- **File Management** 📁
    - Provides file management operations on the device, including:
        - Create folders
        - Upload files
        - Download files
        - Rename files
        - Delete files
        - View detailed file information

- **Terminal Operations** 💻
    - Directly send Shell commands for terminal operations.
    - Optimized terminal display for better user experience.

- **Screen Control** 🖱️
    - Supports direct control of device screen operations from the web interface, including:
        - Swiping
        - Mouse wheel operations
        - Keyboard input

- **Performance Monitoring** 📈
    - Real-time monitoring of device performance metrics:
        - CPU usage
        - Memory consumption
        - FPS (Frames Per Second)
        - Network traffic
        - Battery level and temperature
    - Customizable data collection intervals and limits
    - Export performance data reports

- **Real-time Logcat** 📋
    - View and filter device logs in real-time
    - Enhanced log display with color-coding and filtering options

- **Future Features** 🛠️
    - Application management
    - Screenshot functionality, etc.

## 🛠️ Technology Stack

- **Frontend Framework**: Vue 3
- **State Management**: Vuex
- **Routing Management**: Vue Router
- **Build Tool**: Vite
- **Styling**: CSS/Sass
- **Other**: Element-Plus, BootStrap (UI frameworks)

## 💻 Environment Requirements

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **Browser**: Chrome (Firefox and other browsers do not support WebUSB)

## 📂 Project Structure
```plaintext
NowWebAdb
├── public
│   ├── icon.svg          # Web page icon
├── src
│   ├── assets            # Static resource
│   ├── components        # Common components
│   │   ├── overview      # Device overview components
│   ├── layouts           # Layouts
│   ├── pages             # Pages
│   ├── router            # Routing
│   ├── stores            # State management
│   ├── utils             # Utility functions
│   │   ├── performance   # Performance monitoring utilities
│   ├── App.vue           # Root component
│   ├── auto-imports.d.ts # Vite auto-import types
│   ├── main.js           # Entry file
├── .gitignore            # Git ignore file
├── index.html            # HTML template
├── LICENSE               # License
├── package.json          # Project dependencies
├── README.md             # Project documentation
├── README-CN.md          # Project documentation (Chinese)
├── vite.config.js        # vite Vite configuration file
```
## 🚀 Quick Start
1. Clone the repository:
    ```bash
    git clone https://github.com/srrchysfzy/NowWebAdb.git
    ```
2. Install dependencies:：
    ```bash
    cd NowWebAdb
    npm install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```
4. Open http://localhost:5173 in your browser to see the result.

## 📝 Contribution
Feel free to submit Issues and Pull Requests to help improve the project! 😊

## 🎉 Acknowledgments
Thank you to the following open-source projects and tools that made this project possible:

* [ya-webadb](https://github.com/yume-chan/ya-webadb) - Open-source library for managing Android devices.
* [Vue.js](https://vuejs.org) - Powerful frontend framework.
* [Vite](https://vitejs.dev) - Fast build tool.
* [Element Plus](https://element-plus.org) - Rich UI components.
* [BootStrap](https://getbootstrap.com) - CSS framework.

## 📄 License
GPL-3.0
