<template>
  <div class="login-form-wrapper">
    <div class="welcome-header">
      <div class="welcome-indicator"></div>
      <div class="welcome-text">欢迎您</div>
    </div>
    <div class="welcome-subtitle">
      使用 {{ appStore.business.projectName }} 用户端
    </div>
    <div class="login-tabs">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'code' }"
        @click="activeTab = 'code'"
      >
        手机验证码登录
        <div v-if="activeTab === 'code'" class="tab-indicator"></div>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'pass' }"
        @click="activeTab = 'pass'"
      >
        账号密码登录
        <div v-if="activeTab === 'pass'" class="tab-indicator"></div>
      </div>
    </div>
    <div class="login-form-content">
      <formCode v-if="activeTab === 'code'"></formCode>
      <formPass v-else></formPass>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useAppStore } from '@/store';
import formPass from './form-pass.vue';
import formCode from './form-code.vue';

const appStore = useAppStore();
const activeTab = ref('code');
</script>

<style lang="less" scoped>
.login-form-wrapper {
  width: 100%;
  height: 100%;
}

.welcome-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.welcome-indicator {
  width: 4px;
  height: 28px;
  background-color: #3277FF;
  border-radius: 2px;
  margin-right: 11px;
}

.welcome-text {
  font-size: 30px;
  font-weight: bold;
  color: #353D4B;
}

.welcome-subtitle {
  font-size: 22px;
  font-weight: bold;
  color: #353D4B;
  margin-bottom: 20px;
}

.login-tabs {
  display: flex;
  margin-bottom: 30px;
  position: relative;
}

.tab-item {
  font-size: 16px;
  color: #353D4B;
  margin-right: 24px;
  cursor: pointer;
  position: relative;
  padding-bottom: 11px;

  &.active {
    font-weight: bold;
  }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 79px;
  height: 3px;
  background-color: #3277FF;
  border-radius: 5px;
}

.login-form-content {
  width: 100%;
}
</style>
