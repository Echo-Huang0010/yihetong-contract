<template>
  <div class="contract-template-page">
    <div class="page-head">
      <div>
        <div class="breadcrumb">合同签署 / 合同模板</div>
        <h1>合同模板</h1>
      </div>
      <a-input-search
        v-model="query.name"
        class="search"
        placeholder="搜索模板名称"
        allow-clear
        @search="reload"
        @clear="reload"
      />
    </div>

    <div class="category-strip">
      <button
        class="category-item"
        :class="{ active: !query.categoryId }"
        type="button"
        @click="selectCategory('')"
      >
        全部
      </button>
      <button
        v-for="item in flatCategories"
        :key="item.id"
        class="category-item"
        :class="{ active: String(query.categoryId) === String(item.id) }"
        type="button"
        @click="selectCategory(item.id)"
      >
        {{ item.name }}
      </button>
    </div>

    <a-spin :loading="loading">
      <div v-if="templates.length" class="template-grid">
        <article v-for="item in templates" :key="item.id" class="template-card">
          <div class="template-title">{{ item.name }}</div>
          <p class="template-desc">{{ item.description || '暂无描述' }}</p>
          <div class="template-meta">
            <span>{{ item.categoryName || '未分类' }}</span>
            <span :class="{ warning: !templateFileUrl(item) }">
              {{ templateFileUrl(item) ? '文件可用' : '待生成文件' }}
            </span>
          </div>
          <a-space>
            <a-button type="primary" size="small" @click="startTemplate(item)">发起签署</a-button>
            <a-button size="small" @click="openDetail(item)">详情</a-button>
            <a-button v-if="templateFileUrl(item)" size="small" @click="openFile(item)">
              查看文件
            </a-button>
          </a-space>
        </article>
      </div>
      <a-empty v-else description="暂无合同模板" />
    </a-spin>

    <a-pagination
      class="pager"
      :total="total"
      :current="query.pageNum"
      :page-size="query.pageSize"
      show-total
      @change="changePage"
    />

    <a-drawer
      v-model:visible="detailVisible"
      width="620px"
      :footer="false"
      unmount-on-close
      title="合同模板详情"
    >
      <a-spin :loading="detailLoading">
        <div v-if="activeTemplate" class="detail-panel">
          <div class="detail-title">{{ activeTemplate.name || '-' }}</div>
          <p>{{ activeTemplate.description || '暂无描述' }}</p>
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="模板分类">
              {{ activeTemplate.categoryName || '未分类' }}
            </a-descriptions-item>
            <a-descriptions-item label="文件状态">
              <a-tag :color="templateFileUrl(activeTemplate) ? 'green' : 'orange'">
                {{ templateFileUrl(activeTemplate) ? '文件可用' : '待生成文件' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="PDF 地址">
              <span class="url-text">{{ activeTemplate.pdfUrl || '-' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="源文件地址">
              <span class="url-text">{{ activeTemplate.fileUrl || '-' }}</span>
            </a-descriptions-item>
          </a-descriptions>
          <div class="detail-actions">
            <a-button type="primary" @click="startTemplate(activeTemplate)">发起签署</a-button>
            <a-button :disabled="!templateFileUrl(activeTemplate)" @click="openFile(activeTemplate)">
              查看文件
            </a-button>
          </div>
        </div>
        <a-empty v-else description="暂无模板详情" />
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
  import { Message } from '@arco-design/web-vue';
  import { computed, onMounted, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAppStore } from '@/store';
  import { getToken } from '@/utils/auth';
  import {
    getContractTemplateCategories,
    getContractTemplateDetail,
    getContractTemplates,
  } from '@/api/contract';

  const router = useRouter();
  const appStore = useAppStore();
  const loading = ref(false);
  const categories = ref<any[]>([]);
  const templates = ref<any[]>([]);
  const total = ref(0);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const activeTemplate = ref<any>(null);
  const query = reactive({
    pageNum: 1,
    pageSize: 12,
    categoryId: '',
    name: '',
  });

  const normalizeRows = (res: any) => {
    const data = res?.data || res || {};
    total.value = Number(data.total || 0);
    return data.rows || data.records || data.list || [];
  };

  const flatten = (items: any[], level = 0): any[] =>
    (items || []).flatMap((item) => [
      { ...item, name: `${level ? '　'.repeat(level) : ''}${item.name}` },
      ...flatten(item.children || [], level + 1),
    ]);

  const flatCategories = computed(() => flatten(categories.value));

  const loadCategories = async () => {
    const res: any = await getContractTemplateCategories();
    const data = res?.data || res;
    categories.value = Array.isArray(data) ? data : data?.rows || [];
  };

  const loadTemplates = async () => {
    loading.value = true;
    try {
      const res = await getContractTemplates(query);
      templates.value = normalizeRows(res);
    } catch (error: any) {
      templates.value = [];
      Message.error(error?.message || '合同模板加载失败');
    } finally {
      loading.value = false;
    }
  };

  const reload = () => {
    query.pageNum = 1;
    loadTemplates();
  };

  const selectCategory = (id: string | number) => {
    query.categoryId = String(id || '');
    reload();
  };

  const changePage = (page: number) => {
    query.pageNum = page;
    loadTemplates();
  };

  const h5BaseUrl = () => {
    const runtimeValues = (appStore.runtimeConfig?.values || {}) as Record<string, string>;
    const configured = String(
      appStore.runtimeConfig?.h5BaseUrl ||
        runtimeValues['client.h5-base-url'] ||
        import.meta.env.VITE_H5_BASE_URL ||
        (import.meta.env.DEV ? 'http://127.0.0.1:8097' : '')
    ).trim();
    return configured.replace(/\/$/, '');
  };

  const templateFileUrl = (item: any) =>
    item?.pdfUrl || item?.fileUrl || item?.fileDownloadUrl || item?.url || '';

  const startTemplate = (item: any) => {
    if (!templateFileUrl(item)) {
      Message.warning('模板文件未生成，暂不能发起');
      return;
    }
    const baseUrl = h5BaseUrl();
    if (!baseUrl) {
      Message.error('H5 公网地址未配置，请联系管理员在部署配置中维护');
      return;
    }
    const url = `${baseUrl}/#/pages/contract/sign/signByTemplate?tid=${item.id}&token=${getToken()}`;
    router.push({ name: 'iframeH5', query: { url } });
  };

  const openFile = (item: any) => {
    const url = templateFileUrl(item);
    if (url) window.open(url, '_blank');
  };

  const openDetail = async (item: any) => {
    activeTemplate.value = item;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const res = await getContractTemplateDetail(item.id);
      const data = res?.data || res || {};
      activeTemplate.value = { ...item, ...data };
    } catch (error: any) {
      Message.error(error?.message || '模板详情加载失败');
    } finally {
      detailLoading.value = false;
    }
  };

  onMounted(async () => {
    await loadCategories();
    await loadTemplates();
  });
</script>

<style scoped lang="less">
  .contract-template-page {
    min-height: calc(100vh - 64px);
    padding: 20px;
    background: #f5f7fb;
  }

  .page-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 16px;

    h1 {
      margin: 4px 0 0;
      color: #1d2533;
      font-size: 24px;
      line-height: 32px;
    }
  }

  .breadcrumb {
    color: #8a94a6;
    font-size: 13px;
  }

  .search {
    width: 320px;
  }

  .category-strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 8px;
    background: #ffffff;
  }

  .category-item {
    flex: 0 0 auto;
    height: 32px;
    padding: 0 14px;
    border: 1px solid #e5eaf3;
    border-radius: 6px;
    background: #ffffff;
    color: #4b5565;
    cursor: pointer;

    &.active {
      border-color: #317cff;
      background: #edf5ff;
      color: #1f5fc8;
      font-weight: 600;
    }
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .template-card {
    padding: 18px;
    border: 1px solid #e8edf5;
    border-radius: 8px;
    background: #ffffff;
  }

  .template-title {
    color: #1f2937;
    font-size: 16px;
    font-weight: 650;
  }

  .template-desc {
    min-height: 44px;
    margin: 8px 0 14px;
    color: #667085;
    line-height: 22px;
  }

  .template-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    color: #8a94a6;
    font-size: 13px;

    .warning {
      color: #d46b08;
    }
  }

  .pager {
    margin-top: 18px;
    justify-content: flex-end;
  }

  .detail-panel {
    display: grid;
    gap: 16px;
  }

  .detail-title {
    color: #1f2937;
    font-size: 20px;
    font-weight: 650;
  }

  .detail-panel p {
    margin: 0;
    color: #667085;
    line-height: 22px;
  }

  .url-text {
    word-break: break-all;
  }

  .detail-actions {
    display: flex;
    gap: 10px;
  }
</style>
