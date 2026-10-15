<template>
  <div class="webview-container">
    <iframe :src="url" width="100%" height="100%" frameborder="0"></iframe>
  </div>
</template>

<script>
export default {
  watch: {
    url(newUrl) {
      console.log('url changed:', newUrl);
      localStorage.setItem('videoUrl', newUrl);
    }
  },
  data() {
    return {
      // 使用一个公网可访问的URL作为默认值
      url: localStorage.getItem('videoUrl') || 'http://10.0.0.6:89'
    };
  },
  mounted() {
    // 添加错误处理
    window.addEventListener('error', this.handleError, true);
  },
  methods: {
    handleError(event) {
      console.error('页面加载错误:', event);
      // 可以在这里添加错误处理逻辑，比如显示错误信息或加载备用页面
    }
  },
  beforeUnmount() {
    window.removeEventListener('error', this.handleError, true);
  }
};
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
}

.webview-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>