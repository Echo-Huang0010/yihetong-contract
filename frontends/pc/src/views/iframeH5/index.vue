<!--
 * @Description:
 * @LastEditTime: 2023-12-14 19:13:52
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
-->
<template>
  <div class="container">
    <iframe v-if="show" :src="decodeUrl" :class="iframeClass"></iframe>
  </div>
</template>

<script lang="ts" setup>
  import { useRoute, useRouter } from 'vue-router';
  import { ref } from 'vue';

  const route = useRoute();
  const router = useRouter();
  const { url } = route.query;
  const urlValue = Array.isArray(url) ? url[0] : url;
  const iframeClass = ref('');
  const show = ref(false);
  const decodeUrl = ref(decodeURIComponent(urlValue || ''));
  console.log(decodeUrl);
  if (decodeUrl.value.indexOf('yilink') === -1) {
    iframeClass.value = 'iframe';
  } else {
    iframeClass.value = 'iframe-yilink';
    decodeUrl.value += '&sourceType=pc';
  }
  decodeUrl.value += '&sourceType=pc';
  show.value = true;
  console.log(111);
  window.addEventListener('message', (event) => {
    console.log('message:data');
    console.log(event);
    if (event.data.msg && event.data.msg === 'back') {
      router.back();
    }
  });
</script>

<style lang="less" scoped>
  .container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    .iframe {
      height: 100%;
      width: 100%;
    }
    .iframe-yilink {
      height: 750px;
      width: 375px;
    }
  }
</style>
