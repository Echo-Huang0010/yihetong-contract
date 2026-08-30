<!--
 * @Description:
 * @LastEditTime: 2023-06-09 11:37:13
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
-->
<template>
  <a-card :bordered="false">
    <a-space align="start" :size="14">
      <a-avatar :size="80" class="info-avatar">
        <img v-if="userStore.avatarUrl" :src="userStore.avatarUrl" />

        <img v-else :src="avatarImg" />
      </a-avatar>
      <a-descriptions
        :data="renderData"
        :column="1"
        align="right"
        size="large"
        :label-style="{
          width: '100px',
          fontWeight: 'normal',
          color: 'rgb(var(--gray-8))',
          paddingRight: '10px',
        }"
        :value-style="{
          width: '400px',
          paddingLeft: '8px',
          textAlign: 'left',
        }"
      >
        <template #label="{ label }">{{ $t(label) }} :</template>
        <template #value="{ value }">
          <span>{{ value || '-' }}</span>
        </template>
      </a-descriptions>
    </a-space>
  </a-card>
</template>

<script lang="ts" setup>
  import { useUserStore } from '@/store';
  import type { DescData } from '@arco-design/web-vue/es/descriptions/interface';
  import avatarImg from '@/assets/images/avatar.png';

  const userStore = useUserStore();
  console.log(userStore);
  const renderData = [
    {
      label: '用户名',
      value: userStore.nickname,
    },
    {
      label: '手机号码',
      value: userStore.phone,
    },
    {
      label: '公司名称',
      value: userStore.companyName,
    },
  ] as DescData[];
</script>

<style scoped lang="less">
  .arco-card {
    padding: 14px 0 4px 4px;
    border-radius: 4px;
  }
  :deep(.arco-avatar-trigger-icon-button) {
    width: 32px;
    height: 32px;
    line-height: 32px;
    background-color: #e8f3ff;
    .arco-icon-camera {
      margin-top: 8px;
      color: rgb(var(--arcoblue-6));
      font-size: 14px;
    }
  }
  :deep(.arco-descriptions-item-label) {
    font-weight: normal;
    vertical-align: top;
  }
</style>
