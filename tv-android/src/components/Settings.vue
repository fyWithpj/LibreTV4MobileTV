<template>
  <main class="settings-screen">
    <section class="settings-card">
      <img class="logo" src="@/assets/libretv-logo.png" alt="LibreTV" />
      <h1>连接你的 LibreTV 服务</h1>
      <p class="description">请确认电视与电脑连接同一 Wi-Fi。默认地址已设为书房电脑。</p>

      <label class="field-label" for="server-address">服务地址</label>
      <div class="address-row">
        <el-select v-model="scheme" aria-label="协议" class="scheme-select">
          <el-option label="http://" value="http://" />
          <el-option label="https://" value="https://" />
        </el-select>
        <el-input
          id="server-address"
          ref="addressInput"
          v-model="address"
          aria-label="LibreTV 服务地址"
          placeholder="libretv.local:8081"
          autocomplete="url"
          @keyup.enter="saveSettings"
        />
      </div>

      <div class="actions">
        <el-button type="primary" size="large" @click="saveSettings">保存并连接</el-button>
        <el-button size="large" @click="$emit('close')">返回</el-button>
      </div>
    </section>
  </main>
</template>

<script>
import { ElMessage } from "element-plus";

const DEFAULT_SERVER_URL = "http://libretv.local:8081";

export default {
  emits: ["close", "saved"],
  data() {
    return {
      scheme: "http://",
      address: "libretv.local:8081",
    };
  },
  mounted() {
    const saved = localStorage.getItem("videoUrl") || DEFAULT_SERVER_URL;
    if (saved.startsWith("https://")) {
      this.scheme = "https://";
      this.address = saved.slice(8);
    } else if (saved.startsWith("http://")) {
      this.scheme = "http://";
      this.address = saved.slice(7);
    } else if (saved.trim()) {
      this.address = saved.trim();
    }
    while (this.address.endsWith("/")) this.address = this.address.slice(0, -1);
    this.$nextTick(() => this.$refs.addressInput?.focus?.());
  },
  methods: {
    saveSettings() {
      let raw = this.address.trim();
      while (raw.endsWith("/")) raw = raw.slice(0, -1);
      if (!raw) {
        ElMessage.error("请输入服务地址");
        return;
      }
      let fullUrl = raw;
      if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
        fullUrl = `${this.scheme}${raw}`;
      }
      try {
        const parsed = new URL(fullUrl);
        if (!parsed.hostname || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
          throw new Error("invalid URL");
        }
      } catch {
        ElMessage.error("地址格式不正确");
        return;
      }
      localStorage.setItem("videoUrl", fullUrl);
      this.$emit("saved");
    },
  },
};
</script>

<style scoped>
.settings-screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 32px;
  color: #f4f4f5;
  background: rgba(5, 7, 12, .96);
}

.settings-card {
  width: min(900px, 88vw);
  padding: 48px 56px;
  border: 1px solid #30333a;
  border-radius: 20px;
  background: #15171c;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .45);
}

.logo {
  display: block;
    width: 120px;
  height: 120px;
  object-fit: contain;
  margin: 0 auto 28px;
}

h1 {
  margin: 0 0 12px;
  text-align: center;
  font-size: 32px;
}

.description {
  margin: 0 0 30px;
  text-align: center;
  color: #b4b8c2;
  font-size: 20px;
}

.field-label {
  display: block;
  margin: 0 0 10px;
  font-size: 18px;
}

.address-row {
  display: flex;
  gap: 12px;
}

.scheme-select {
  width: 150px;
  flex: 0 0 150px;
}

.address-row :deep(.el-input__wrapper),
.address-row :deep(.el-select__wrapper) {
  min-height: 58px;
  font-size: 20px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}

.actions :deep(.el-button) {
  min-width: 180px;
  min-height: 56px;
  font-size: 18px;
}

:deep(button:focus-visible),
:deep(input:focus-visible),
:deep(.el-select:focus-visible) {
  outline: 4px solid #f43f5e;
  outline-offset: 3px;
}
</style>
