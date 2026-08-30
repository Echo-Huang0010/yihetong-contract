<!--
 * @Description:
 * @LastEditTime: 2023-12-19 17:05:30
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-10 18:17:13
-->
<template>
  <a-layout-footer class="footer"
    >@{{ appStore.business?.companyName }}提供技术支持</a-layout-footer
  >
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/store';

  const appStore = useAppStore();
</script>

<style lang="less" scoped>
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    color: white;
    text-align: center;
  }
</style>
