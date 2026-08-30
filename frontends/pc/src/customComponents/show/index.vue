<!--
 * @Description:
 * @LastEditTime: 2023-03-02 16:34:43
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-01 15:52:13
-->
<template>
  <component :is="fieldData.useName" @click="click">{{
    defaultValue
  }}</component>
</template>

<script lang="ts" setup>
  const props = defineProps({
    defaultValue: {
      type: String,
      default: '',
    },
    fieldData: {
      type: Object,
      default: () => {
        return {};
      },
    },
  });
  const emit = defineEmits(['clickShowItem']);
  const click = () => {
    emit('clickShowItem', {
      fieldName: props.fieldData.fieldName,
    });
  };
</script>

<style lang="less" scoped></style>
