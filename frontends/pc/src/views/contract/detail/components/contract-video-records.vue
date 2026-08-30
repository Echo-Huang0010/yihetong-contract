<template>
  <div class="contract-video-records">
    <div class="contract-video-records-title">签署视频</div>
    <a-spin :loading="loading" style="width: 100%">
      <a-empty
        v-if="!loading && records.length === 0"
        class="contract-video-empty"
        description="暂无可查看的视频记录"
      />
      <div v-else class="contract-video-grid">
        <div
          v-for="item in records"
          :key="item.id"
          class="contract-video-item"
        >
          <video
            class="contract-video-player"
            :src="item.videoUrl"
            controls
          ></video>
          <div class="contract-video-meta">
            <span>时长 {{ item.duration || 0 }} 秒</span>
            <span v-if="item.createTime">{{ item.createTime }}</span>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue';
  import { getContractVideoRecords } from '@/api/contract-video';
  import type { SignerVideoRecord } from '@/api/contract-video';

  const props = defineProps({
    contractId: {
      type: [String, Number],
      default: '',
    },
  });

  const loading = ref(false);
  const records = ref<SignerVideoRecord[]>([]);

  const fetchRecords = async () => {
    if (!props.contractId) {
      records.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await getContractVideoRecords(props.contractId);
      records.value = Array.isArray(res.data) ? res.data : [];
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchRecords);
  watch(() => props.contractId, fetchRecords);
</script>

<style scoped lang="less">
  .contract-video-records {
    margin-top: 20px;
  }

  .contract-video-records-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-1);
  }

  .contract-video-empty {
    padding: 24px 0;
  }

  .contract-video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }

  .contract-video-item {
    padding: 12px;
    border: 1px solid var(--color-neutral-3);
    border-radius: 8px;
    background: var(--color-bg-2);
  }

  .contract-video-player {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    background: #000;
  }

  .contract-video-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--color-text-3);
  }
</style>
