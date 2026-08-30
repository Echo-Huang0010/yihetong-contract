<template>
  <div v-if="isMounted">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script> 