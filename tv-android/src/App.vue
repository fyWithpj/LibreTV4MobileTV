<template>
  <WebView v-if="!showSettings" />
  <Settings v-else @close="showSettings = false" @saved="showSettings = false" />

  <button
    v-if="!showSettings"
    id="settings-button"
    type="button"
    aria-label="服务器设置"
    title="服务器设置"
    @click="showSettings = true"
    class="settings-button"
  >
    <svg class="icon" width="24" height="24" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M800 32H224a192 192 0 0 0-192 192v576a192 192 0 0 0 192 192h576a192 192 0 0 0 192-192V224a192 192 0 0 0-192-192zM189.76 367.04A128 128 0 0 1 436.8 320h315.2a48 48 0 0 1 0 96h-315.84a128 128 0 0 1-246.08-48.96z m516.16 417.92A128 128 0 0 1 587.2 704H272a48 48 0 0 1 0-96h315.84a128 128 0 1 1 118.08 176.96z" fill="currentColor" />
    </svg>
  </button>
</template>

<script>
import WebView from "./components/WebView.vue";
import Settings from "./components/Settings.vue";

const DEFAULT_SERVER_URL = "http://libretv.local:8081";

export default {
  components: { WebView, Settings },
  data() {
    return { showSettings: false };
  },
  mounted() {
    if (!localStorage.getItem("videoUrl")) {
      localStorage.setItem("videoUrl", DEFAULT_SERVER_URL);
    }
    window.addEventListener("keydown", this.handleRemoteKeys, true);
    this.$nextTick(() => document.getElementById("settings-button")?.blur());
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleRemoteKeys, true);
  },
  methods: {
    handleRemoteKeys(event) {
      if (event.key === "Menu" || event.key === "ContextMenu") {
        this.showSettings = true;
        event.preventDefault();
      } else if ((event.key === "Escape" || event.key === "Backspace") && this.showSettings) {
        this.showSettings = false;
        event.preventDefault();
      }
    },
  },
};
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  text-align: left;
}

.settings-button {
  position: fixed;
  left: 22px;
  bottom: 22px;
  z-index: 100;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .28);
  border-radius: 50%;
  background: rgba(18, 18, 18, .82);
  color: white;
  opacity: .72;
}

.settings-button:focus-visible {
  opacity: 1;
  outline: 4px solid #f43f5e;
  outline-offset: 3px;
}
</style>
