<!--
 * @Description:
 * @LastEditTime: 2023-03-17 14:36:35
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
-->
<template>
  <a-breadcrumb class="container-breadcrumb">
    <a-breadcrumb-item>
      <icon-apps />
    </a-breadcrumb-item>
    <a-breadcrumb-item
      v-for="(item, index) in levelList"
      :key="index"
      @click.prevent="handleLink(item, index)"
    >
      {{ $t(item?.meta?.locale || '') }}
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script lang="ts" setup>
  import { watch, ref } from 'vue';
  import { RouteLocationMatched, useRoute, useRouter } from 'vue-router';

  const route = useRoute();
  const router = useRouter();
  const levelList = ref<RouteLocationMatched[]>([]);
  const getBreadcrumb = () => {
    const matched = route.matched.filter(
      (item) => item.meta && item.meta.locale
    );

    levelList.value = matched.filter(
      (item) => item.meta && item.meta.locale && item.meta.breadcrumb !== false
    );
    // console.log(levelList.value);
  };

  const handleLink = (item: { redirect: any; path: any }, index: any) => {
    // if (index && index !== levelList.value.length - 1) {
    const { redirect, path } = item;
    if (redirect) {
      router.push(redirect);
      return;
    }
    router.push(path);
    // }
  };
  watch(
    () => route,
    () => {
      getBreadcrumb();
    },
    { deep: true, immediate: true }
  );
  getBreadcrumb();
</script>

<style scoped lang="less">
  .container-breadcrumb {
    margin: 16px 0;
    :deep(.arco-breadcrumb-item) {
      color: rgb(var(--gray-6));
      &:last-child {
        color: rgb(var(--gray-8));
      }
    }
  }
</style>
