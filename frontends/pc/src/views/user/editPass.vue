<!--
 * @Description:
 * @LastEditTime: 2023-06-14 15:12:50
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
-->
<template>
  <div class="container">
    <Breadcrumb />
    <forgetPass />
  </div>
</template>

<script lang="ts" setup>
  import forgetPass from './components/forget-pass.vue';
</script>

<style lang="less" scoped>
  .container {
    padding: 0 20px 20px 20px;
  }
</style>
