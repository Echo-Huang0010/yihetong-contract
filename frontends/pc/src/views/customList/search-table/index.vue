<!--
 * @Description:
 * @LastEditTime: 2023-05-22 11:58:48
 * @LastEditors: wudi
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:57:39
-->
<template>
  <customList :config="config"></customList>
</template>

<script lang="ts" setup>
  import customList from '@/customComponents/customList/index.vue';
  import jsons from '@/customJson/index';
  import { useRoute } from 'vue-router';

  const route = useRoute();
  const name1 = String(route?.meta?.jsonName);
  const names = `./${name1}.json`;
  const config = jsons[names] || {};
</script>

<script lang="ts">
  export default {
    name: 'SearchTable',
  };
</script>

<style scoped lang="less"></style>
