
# 📺 LibreTV Cast

**LibreTV Cast** 是一个基于 [LibreTV](https://github.com/LibreSpark/LibreTV) 的跨平台影视聚合播放器，专为 Android 手机与 TV 端优化，支持遥控器操作、WebView 嵌入、快速部署与自定义扩展。

---

## 🚀 项目特点

- 🎬 **聚合播放**：支持多源影视搜索与在线播放
- 📱 **多端适配**：适配 Android 手机与电视遥控器操作
- 🌐 **WebView 嵌入**：基于 Capacitor + Vue 构建，轻量高效
- 🧩 **可扩展性强**：支持自定义 API、主题、播放逻辑
- 🛠️ **快速部署**：支持本地打包 APK，或发布到应用市场

---

## 🧱 技术栈

- **前端框架**：Vue 3 + Vite
- **移动端容器**：Capacitor
- **原项目依赖**：LibreTV（HTML + JS）
- **构建工具**：Android Studio（用于打包 APK）

---

## 📦 安装与运行

### 1. 克隆项目

```bash
git clone https://github.com/yourname/libretv-cast.git
cd libretv-cast
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建前端

```bash
npm run build
```

### 4. 初始化 Capacitor

```bash
npx cap init
npx cap add android
```

### 5. 打开 Android Studio 并运行

```bash
npx cap open android
```

---

## 🎮 TV 遥控器支持

LibreTV Cast 支持遥控器方向键与确认键操作，适配 Android TV 盒子与智能电视。你可以通过键盘事件监听实现焦点跳转与播放控制。

---

## 📁 项目结构

```bash
libretv-cast/
├── src/               # Vue 源码
├── dist/              # 构建输出
├── android/           # Android 项目（由 Capacitor 生成）
├── capacitor.config.ts
└── ...
```

---

## 📜 开源协议

本项目基于 Apache 2.0 License 开源，欢迎自由使用与二次开发。

---

## 🙌 致谢

- [LibreTV](https://github.com/LibreSpark/LibreTV) - 原始项目
- Capacitor - 跨平台容器
- Vue.js - 前端框架

---

> 📢 欢迎提交 Issue 或 PR，一起打造更好用的 TV 播放器！
```
