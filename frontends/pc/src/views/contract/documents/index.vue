<template>
  <div class="contract-document-page">
    <div class="page-head">
      <div>
        <div class="breadcrumb">合同签署 / 合同文书</div>
        <h1>合同文书</h1>
      </div>
      <a-input-search
        v-model="query.title"
        class="search"
        placeholder="搜索文书标题"
        allow-clear
        @search="reload"
        @clear="reload"
      />
    </div>

    <a-tabs v-model:active-key="activeTab" class="tabs" @change="reload">
      <a-tab-pane key="library" title="文书库" />
      <a-tab-pane key="mine" title="我的文书" />
    </a-tabs>

    <div v-if="activeTab === 'library'" class="category-strip">
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
      <div v-if="documents.length" class="document-list">
        <article v-for="item in documents" :key="item.id" class="document-row">
          <div class="document-main">
            <div class="document-title">{{ item.title || item.name }}</div>
            <p>{{ item.description || item.summary || '暂无描述' }}</p>
          </div>
          <div class="document-actions">
            <a-button size="small" type="primary" @click="openDocument(item)">详情</a-button>
            <a-button v-if="documentFileUrl(item)" size="small" @click="downloadDocument(item)">下载</a-button>
            <a-button
              v-if="activeTab === 'mine'"
              size="small"
              status="danger"
              @click="removeUserDocument(item)"
            >
              删除
            </a-button>
          </div>
        </article>
      </div>
      <a-empty v-else :description="activeTab === 'library' ? '暂无文书模板' : '暂无我的文书'" />
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
      width="680px"
      :footer="false"
      unmount-on-close
      title="合同文书详情"
    >
      <a-spin :loading="detailLoading">
        <div v-if="activeDocument" class="detail-panel">
          <div>
            <div class="detail-title">{{ activeDocument.title || activeDocument.name || '-' }}</div>
            <p>{{ activeDocument.description || activeDocument.summary || '暂无描述' }}</p>
          </div>
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="来源">
              {{ activeTab === 'library' ? '文书库' : '我的文书' }}
            </a-descriptions-item>
            <a-descriptions-item label="分类">
              {{ activeDocument.categoryName || '未分类' }}
            </a-descriptions-item>
            <a-descriptions-item label="文件状态">
              <a-tag :color="documentFileUrl(activeDocument) ? 'green' : 'orange'">
                {{ documentFileUrl(activeDocument) ? '文件可下载' : '暂无文件' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="文件地址">
              <span class="url-text">{{ documentFileUrl(activeDocument) || '-' }}</span>
            </a-descriptions-item>
          </a-descriptions>
          <div v-if="activeDocument.content || activeDocument.richContent" class="content-preview">
            <div class="content-title">文书内容</div>
            <div class="content-body" v-html="activeDocument.content || activeDocument.richContent"></div>
          </div>
          <div class="detail-actions">
            <a-button
              type="primary"
              :disabled="!documentFileUrl(activeDocument)"
              @click="downloadDocument(activeDocument)"
            >
              下载文书
            </a-button>
            <a-button
              v-if="activeTab === 'mine'"
              status="danger"
              @click="removeUserDocument(activeDocument)"
            >
              删除我的文书
            </a-button>
          </div>
        </div>
        <a-empty v-else description="暂无文书详情" />
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
  import { Message, Modal } from '@arco-design/web-vue';
  import { computed, onMounted, reactive, ref } from 'vue';
  import {
    deleteUserDocument,
    getDocumentCategories,
    getDocumentDetail,
    getDocuments,
    getUserDocumentDetail,
    getUserDocuments,
    recordDocumentDownload,
  } from '@/api/contract';

  const loading = ref(false);
  const activeTab = ref('library');
  const categories = ref<any[]>([]);
  const documents = ref<any[]>([]);
  const total = ref(0);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const activeDocument = ref<any>(null);
  const query = reactive({
    pageNum: 1,
    pageSize: 10,
    categoryId: '',
    title: '',
  });

  const flatten = (items: any[], level = 0): any[] =>
    (items || []).flatMap((item) => [
      { ...item, name: `${level ? '　'.repeat(level) : ''}${item.name}` },
      ...flatten(item.children || [], level + 1),
    ]);

  const flatCategories = computed(() => flatten(categories.value));

  const normalizeRows = (res: any) => {
    const data = res?.data || res || {};
    total.value = Number(data.total || 0);
    return data.rows || data.records || data.list || [];
  };

  const loadCategories = async () => {
    const res: any = await getDocumentCategories();
    const data = res?.data || res;
    categories.value = Array.isArray(data) ? data : [];
  };

  const loadDocuments = async () => {
    loading.value = true;
    try {
      const params = {
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        title: query.title,
        categoryId: activeTab.value === 'library' ? query.categoryId : undefined,
      };
      const res = activeTab.value === 'library' ? await getDocuments(params) : await getUserDocuments(params);
      documents.value = normalizeRows(res);
    } catch (error: any) {
      documents.value = [];
      Message.error(error?.message || '合同文书加载失败');
    } finally {
      loading.value = false;
    }
  };

  const reload = () => {
    query.pageNum = 1;
    loadDocuments();
  };

  const selectCategory = (id: string | number) => {
    query.categoryId = String(id || '');
    reload();
  };

  const changePage = (page: number) => {
    query.pageNum = page;
    loadDocuments();
  };

  const documentFileUrl = (item: any) =>
    item?.fileUrl || item?.documentUrl || item?.downloadUrl || item?.url || '';

  const openDocument = async (item: any) => {
    activeDocument.value = item;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const res =
        activeTab.value === 'library'
          ? await getDocumentDetail(item.id)
          : await getUserDocumentDetail(item.id);
      const data = res?.data || res || {};
      activeDocument.value = { ...item, ...data };
    } catch (error: any) {
      Message.error(error?.message || '文书详情加载失败');
    } finally {
      detailLoading.value = false;
    }
  };

  const downloadDocument = async (item: any) => {
    const url = documentFileUrl(item);
    if (!url) {
      Message.warning('文书文件未生成');
      return;
    }
    try {
      if (activeTab.value === 'library' && item.id) {
        await recordDocumentDownload(item.id);
      }
      window.open(url, '_blank');
    } catch (error: any) {
      Message.error(error?.message || '文书下载失败');
    }
  };

  const removeUserDocument = (item: any) => {
    if (!item?.id) return;
    Modal.confirm({
      title: '删除我的文书',
      content: `确认删除「${item.title || item.name || item.id}」？`,
      okText: '删除',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        await deleteUserDocument(item.id);
        Message.success('我的文书已删除');
        detailVisible.value = false;
        loadDocuments();
      },
    });
  };

  onMounted(async () => {
    await loadCategories();
    await loadDocuments();
  });
</script>

<style scoped lang="less">
  .contract-document-page {
    min-height: calc(100vh - 64px);
    padding: 20px;
    background: #f5f7fb;
  }

  .page-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 12px;

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

  .tabs {
    margin-bottom: 12px;
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

  .document-list {
    display: grid;
    gap: 12px;
  }

  .document-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px;
    border: 1px solid #e8edf5;
    border-radius: 8px;
    background: #ffffff;
  }

  .document-main {
    min-width: 0;

    p {
      margin: 8px 0 0;
      color: #667085;
      line-height: 22px;
    }
  }

  .document-title {
    color: #1f2937;
    font-size: 16px;
    font-weight: 650;
  }

  .document-actions {
    flex: 0 0 auto;
    display: flex;
    gap: 8px;
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
    margin: 8px 0 0;
    color: #667085;
    line-height: 22px;
  }

  .url-text {
    word-break: break-all;
  }

  .content-preview {
    padding: 16px;
    border: 1px solid #e8edf5;
    border-radius: 8px;
    background: #ffffff;
  }

  .content-title {
    margin-bottom: 10px;
    color: #1f2937;
    font-weight: 650;
  }

  .content-body {
    max-height: 360px;
    overflow: auto;
    color: #4b5565;
    line-height: 1.7;
  }

  .detail-actions {
    display: flex;
    gap: 10px;
  }
</style>
