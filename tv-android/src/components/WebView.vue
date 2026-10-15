<template>
  <div class="webview-container">
    <iframe
      ref="frame"
      :src="url"
      title="LibreTV"
      tabindex="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      frameborder="0"
      @load="focusFrame"
    ></iframe>
  </div>
</template>

<script>
const DEFAULT_SERVER_URL = "http://libretv.local:8081";

export default {
  data() {
    return {
      url: localStorage.getItem("videoUrl") || DEFAULT_SERVER_URL,
    };
  },
  mounted() {
    this.focusFrame();
  },
  methods: {
    focusFrame() {
      window.setTimeout(() => this.$refs.frame?.focus(), 150);
    },
  },
};
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.webview-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #090909;
}

.webview-container iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #090909;
}
</style>
