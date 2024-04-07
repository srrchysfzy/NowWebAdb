# 简介

在一些测试工作中，我们总是会很频繁的去安装卸载一些软件，或是需要截图用以反馈BUG，亦或是需要查看一些系统信息，查看当前APP的一些性能表现等等。这些工作虽然不难，但是却很繁琐，所以一直都想做一个可以集成这些功能的工具，虽然市面上有不少类似工具，但大多都需要安装，且不开源，想要做一些定制化的功能较为麻烦，偶然看到chrome内核的浏览器支持WebUSB，也有支持webAdb相关的库，就想着做一个方便二开，方便公司内部使用的工具。

## 相关技术栈及主要库
- vue
- vite
- JavaScript
- Element-Plus
- BootStrap
- ya-webadb

## 环境要求
- node.js 16+

## 目录结构
```
NowWebAdb
├── public
│   ├── icon.svg      # 网页图标
├── src
│   ├── assets        # 静态资源
│   ├── components    # 公共组件
│   ├── layouts       # 布局
│   ├── pages         # 页面
│   ├── router        # 路由
│   ├── stores        # 状态管理
│   ├── App.vue       # 根组件
│   ├── auto-imports.d.ts  # vite自动导入类型
│   ├── main.js       # 入口文件
├── .gitignore        # git忽略文件
├── index.html        # html模板
├── package.json      # 依赖
├── README.md         # 项目说明
├── vite.config.js    # vite配置
```

## 快速开始
```shell
# clone the project
git clone https://github.com/srrchysfzy/NowWebAdb.git
# enter the project directory
cd NowWebAdb
# install dependency
npm install
# develop
npm run dev
```

## 最后

由于这个项目是一个兴趣项目，所以可能会有一些不足之处，还有很多功能都在开发中，目前文档和代码都还不是很完善，后续会慢慢完善，如果你觉得这个项目还不错，欢迎给我一个star，如果有什么问题或者建议，欢迎提issue，我会尽快回复。