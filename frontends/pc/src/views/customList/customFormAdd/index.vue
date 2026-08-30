<!--
 * @Description:
 * @LastEditTime: 2023-05-31 14:23:45
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:57:39
-->
<template>
  <customForm :config="config"></customForm>
</template>

<script lang="ts" setup>
  import customForm from '@/customComponents/customForm/index.vue';
  import jsons from '@/customJson/index';
  import { useRoute } from 'vue-router';

  const route = useRoute();
  const name1 = String(route?.meta?.jsonName);
  const names = `./${name1}.json`;
  const config = jsons[names] || {};
  console.log(route);
</script>

<script lang="ts">
  export default {
    name: 'CustomForm',
  };
</script>

<style scoped lang="less"></style>
