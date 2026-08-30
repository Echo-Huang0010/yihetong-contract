<template>
  <custom-detail :config="config">
    <template #otherInfo>
      <contract-video-records :contract-id="contractId" />
    </template>
  </custom-detail>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import customDetail from '@/customComponents/customDetail/index.vue';
  import jsons from '@/customJson/index';
  import ContractVideoRecords from './components/contract-video-records.vue';

  const route = useRoute();
  const name1 = String(route?.meta?.jsonName);
  const names = `./${name1}.json`;
  const config = jsons[names] || {};
  const contractId = computed(() => {
    const id = route.query.id || route.query.contractId;
    return Array.isArray(id) ? id[0] || '' : id || '';
  });
</script>

<script lang="ts">
  export default {
    name: 'ContractDetail',
  };
</script>
