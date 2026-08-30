<!--
 * @Description:
 * @LastEditTime: 2023-05-26 15:40:07
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:57:39
-->
<template>
  <customDetail :config="config"></customDetail>
</template>

<script lang="ts" setup>
  import customDetail from '@/customComponents/customDetail/index.vue';
  import jsons from '@/customJson/index';
  import { useRoute } from 'vue-router';

  const route = useRoute();
  const name1 = String(route?.meta?.jsonName);
  const names = `./${name1}.json`;
  const config = jsons[names] || {};
  console.log(config);
</script>

<script lang="ts">
  export default {
    name: 'CustomDetail',
  };
</script>

<style scoped lang="less"></style>
