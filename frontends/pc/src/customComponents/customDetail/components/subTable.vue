<!--
 * @Description:
 * @LastEditTime: 2023-08-08 16:09:50
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:57:39
-->
<template>
  <customList use-type="detail" :config="config"></customList>
</template>

<script lang="ts" setup>
  import customList from '@/customComponents/customList/index.vue';
  import jsons from '@/customJson/subJson/index';

  const prop = defineProps({
    jsonName: {
      type: String,
      default: '',
    },
  });
  const name1 = String(prop.jsonName);
  const names = `./${name1}.json`;
  const config = jsons[names] || {};
</script>

<script lang="ts">
  export default {
    name: 'SubTable',
  };
</script>

<style scoped lang="less"></style>
