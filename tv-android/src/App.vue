<template>
  <WebView v-if="!showSettings && !firstTimeSetup" />
  <Settings
    v-if="showSettings || firstTimeSetup"
    @close="handleSettingsClose"
    @saved="handleSettingsSaved"
  />


  <button
    v-if="!firstTimeSetup"
    @click="showSettings = true"
    class="settings-button"
  >
    <svg
      class="icon"
      width="20px"
      height="20.00px"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M800 32H224a192 192 0 0 0-192 192v576a192 192 0 0 0 192 192h576a192 192 0 0 0 192-192V224a192 192 0 0 0-192-192zM189.76 367.04A128 128 0 0 1 436.8 320h315.2a48 48 0 0 1 0 96h-315.84a128 128 0 0 1-246.08-48.96z m516.16 417.92A128 128 0 0 1 587.2 704H272a48 48 0 0 1 0-96h315.84a128 128 0 1 1 118.08 176.96z"
        fill="#231F20"
      />
    </svg>
  </button>
</template>
<script>
import WebView from "./components/WebView.vue";
import Settings from "./components/Settings.vue";
import { StatusBar, Style } from "@capacitor/status-bar";

export default {
  components: {
    WebView,
    Settings,
  },
  data() {
    return {
      showSettings: false,
      firstTimeSetup: false, // 是否是首次设置
      statusBarHeight: 24, // 默认高度
    };
  },
  async mounted() {
    // 检查是否有保存的URL，如果没有则显示设置页面
    const savedUrl = localStorage.getItem("videoUrl");
    if (!savedUrl) {
      this.firstTimeSetup = true;
    }

    // 在移动设备上运行时
    if (this.isMobileDevice()) {
      try {
        // 设置状态栏样式
        await StatusBar.setStyle({ style: Style.Default });

        // 获取状态栏高度（这需要自定义插件或其他方法）
        // 这里只是示例，实际上Capacitor的StatusBar插件没有直接提供获取高度的方法
        const info = await StatusBar.getInfo();
        console.log("状态栏高度:", info);
        if (info && info.height) {
          this.statusBarHeight = info.height;
        }
      } catch (error) {
        console.error("状态栏设置失败:", error);
      }
    }
  },
  methods: {
    isMobileDevice() {
      // 简单检测是否在移动设备上运行
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    },
    handleSettingsClose() {
      // 只有在非首次设置时才关闭设置页面
      if (!this.firstTimeSetup) {
        this.showSettings = false;
      }
    },
    handleSettingsSaved() {
      // 设置保存后，关闭设置页面并退出首次设置模式
      this.showSettings = false;
      this.firstTimeSetup = false;
    },
  },
};
</script>

<style>
#app {
  height: 100%;
  /* 覆盖全局样式限制 */
  max-width: 100% !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  /* display: flex; */
  /* justify-content: center; */
  background: #f7f8fa;
  /* align-items: center; */
}

.status-bar-space {
  height: v-bind(statusBarHeight + "px");
  width: 100%;
  background-color: transparent;
}

.settings-button {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 11;
  padding: 3px 7px;
  display: flex;
}
</style>