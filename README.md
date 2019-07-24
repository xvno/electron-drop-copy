# electron-drop-copy

> Electron + Vue + Element + Websocket

## 关于

### 是什么

这是一个基于electron和vue开发的app(目前为止只有上传原型).
文件上传部分, 通过与本地go-service建立websocket连接, 并使用约定api调用来完成服务调用(上传, 获取列表, 暂停, 续传, 删除).

### 特色

- 支持打包为 **.exe** 和 **.app**运行到相应的平台
- 支持本地开发调试
- 支持集成已有的web项目(Vue项目)

## 如何使用

1. 前端开发环境搭建
2. 启动 **go-service**: 源码地址 https://github.com/hushiyuan0165/go-copy-smaba.git
3. 开发

### 开发环境 & 构建

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build
```

### 启动 go-service

按照源码的要求, 安装并运行 或者 直接运行构建好的可执行文件

### 开发

1. 添加必要的页面组件
2. 添加路由
3. (可选)添加相应的api
4. (可选)添加第三方库