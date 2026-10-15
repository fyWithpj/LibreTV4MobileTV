<template>
  <el-card style="min-width: 680px">
    <img class="logo" src="@/assets/LibreTV-Cast.svg" alt="LibreTV Logo" />
    <el-row class="row-bg" justify="center" :gutter="20">
      <el-col :span="12">
        <el-text class="w-150px mb-2" size="large" type="primary">
          <el-icon><Flag /></el-icon>
          欢迎使用LibreTV Cast, 本应用依赖 LibreTV, 请先部署LibreTV服务,
          并获得URL地址方可使用!
        </el-text>

        <el-input
          v-model="url"
          style="max-width: 600px"
          placeholder="请输入 LibreTV URL地址"
          class="input-with-select"
        >
          <template #prepend>
            <el-select
              v-model="select"
              placeholder="Select"
              style="width: 100px"
            >
              <el-option label="http://" value="1" />
              <el-option label="https://" value="2" />
            </el-select>
          </template>
        </el-input>
        <el-button @click="saveSettings" type="primary" plain
          >保存地址</el-button
        >
        <el-divider border-style="dashed">
        </el-divider>
      </el-col>
    </el-row>
    <el-row class="row-sm" justify="center" :gutter="20">
      <el-link href="https://github.com/LibreSpark/LibreTV" target="_blank">
        <img src="@/assets/github.svg" alt="LibreTV" />&nbsp; LibreTV</el-link
      >
      <el-link
        href="https://github.com/LibreSpark/LibreTV"
        target="_blank"
        style="margin-left: 30px"
      >
        <img src="@/assets/github.svg" alt="LibreTV" />&nbsp; LibreTV
        Cast</el-link
      >
    </el-row>

    <el-row class="row-sm" justify="center" :gutter="20">
      <el-col :span="18">
        <p>
          <el-icon><WarningFilled /></el-icon>
          申明:本项目仅供学习和个人使用 请勿将部署的实例用于商业用途或公开服务
          如因公开分享导致的任何法律问题，用户需自行承担责任
          项目开发者不对用户的使用行为承担任何法律责任;鸣谢:LibreSpark
        </p>
      </el-col>
    </el-row>
  </el-card>
  <!-- <div class="settings-container">
    <div class="input-group">
      <label for="url">url地址：</label>
      <input type="text" v-model="url" id="url" />
    </div>
    <div class="button-group">
      <button @click="saveSettings" class="save-button">保存设置</button>
    </div>
  </div> -->
</template>

<script>
import { ElMessage } from "element-plus";

export default {
  data() {
    return {
      select: "1",
      url: "",
    };
  },
  methods: {
    saveSettings() {
      // 保存设置到本地存储
      localStorage.setItem("videoUrl", this.url);
      // 触发保存成功事件
      this.$emit("saved");
    },
  },
  mounted() {
    // 从本地存储加载设置
    const savedUrl = localStorage.getItem("videoUrl");
    if (savedUrl) {
      this.url = savedUrl;
    }
  },
};
</script>

<style scoped>
.settings-container {
  margin-bottom: 24px;
  padding: 24px;
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 12px #ebedf0;
  overflow: auto;
  min-height: 300px;
  width: 50%;
}

.logo {
  margin: 30px 0;
}

.input-with-select {
  margin: 20px;
}

p {
  font-size: 10px;
  color: #adacac;
}
</style>