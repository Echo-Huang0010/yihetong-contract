<!--
 * @Description:
 * @LastEditTime: 2023-03-17 14:54:04
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
-->
<template>
  <div
    class="login-container"
    :style="{ backgroundImage: `url(${appStore.business.loginBackground || '/images/flagship-login-bg.webp'})` }"
  >
    <div class="login-logo">
      <img class="logo-img" :src="appStore.business.logo" alt="Logo" />
      <div class="logo-text">
        <div class="logo-title">{{ appStore.business.projectName }}</div>
        <div class="logo-subtitle">{{ appStore.business.subtitle }}</div>
      </div>
    </div>
    <div class="login-form-container">
      <LoginForm />
    </div>
    <div class="footer">
      <Footer />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Footer from '@/components/footer/index.vue';
  import { useAppStore } from '@/store';
  import LoginForm from './components/login-form.vue';

  const appStore = useAppStore();
</script>

<style lang="less" scoped>
  .login-container {
    width: 100%;
    height: 100vh;
    position: relative;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 1200px;
    min-height: 800px;
    background-color: #1b1d25;
  }

  .login-logo {
    position: absolute;
    left: 14%;
    top: 46%;
    display: flex;
    flex-direction: row;
    align-items: center;
    .logo-img {
      width: 112px;
      height: 112px;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(17, 80, 160, 0.12);
      object-fit: contain;
    }
    .logo-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      margin-left: 18px;
      color: #f7fbff;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.78);
    }

    .logo-title {
      font-size: 42px;
      font-weight: bold;
    }

    .logo-subtitle {
      margin-top: 6px;
      font-size: 24px;
      color: rgba(247, 251, 255, 0.88);
    }

    @media screen and (max-width: 1600px) {
      left: 15%;
    }

    @media screen and (max-width: 1400px) {
      left: 10%;
    }
  }

  .login-form-container {
    width: 460px;
    height: 600px;
    background: #ffffff;
    border-radius: 10px;
    position: absolute;
    top: 25%;
    right: 15%;
    padding: 50px;
    box-sizing: border-box;

    @media screen and (max-width: 1600px) {
      right: 10%;
    }

    @media screen and (max-width: 1400px) {
      right: 5%;
    }
  }

  .footer {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
</style>

<style lang="less" scoped></style>
