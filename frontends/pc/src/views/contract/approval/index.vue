<template>
  <div class="container">
    <div class="static-breadcrumb">
      <span class="breadcrumb-item">合同签署</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item current">审批记录</span>
    </div>

    <a-card class="general-card">
      <div class="approval-toolbar">
        <div>
          <div class="approval-title">预发起审批</div>
          <div class="approval-desc">审批通过后，可发起正式第三方签署流程。</div>
        </div>
        <a-button type="primary" @click="fetchRecords">刷新</a-button>
      </div>

      <a-table row-key="id" :loading="loading" :data="records" :pagination="false">
        <template #columns>
          <a-table-column title="合同名称" data-index="contractName" :width="240">
            <template #cell="{ record }">
              <div class="contract-name">{{ record.contractName || '-' }}</div>
              <div class="contract-id">ID: {{ record.id }}</div>
            </template>
          </a-table-column>
          <a-table-column title="模板" data-index="templateName" :width="180" />
          <a-table-column title="流程" data-index="flowName" :width="180" />
          <a-table-column title="当前节点" data-index="currentNodeName" :width="160">
            <template #cell="{ record }">{{ record.currentNodeName || '-' }}</template>
          </a-table-column>
          <a-table-column title="状态" :width="150">
            <template #cell="{ record }">
              <a-tag :color="statusColor(record.approvalStatus)">
                {{ statusText(record.approvalStatus) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="提交时间" data-index="submitTime" :width="180" />
          <a-table-column title="操作" :width="220" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="openDetail(record)">详情</a-button>
                <a-button
                  v-if="record.approvalStatus === 3"
                  type="text"
                  size="small"
                  status="success"
                  @click="continueFormal(record)"
                >
                  审批通过
                </a-button>
                <a-button
                  v-if="record.approvalStatus === 4"
                  type="text"
                  size="small"
                  status="warning"
                  @click="resubmitApproval(record)"
                >
                  重新提交
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-drawer v-model:visible="detailVisible" width="720px" title="审批详情" :footer="false">
      <a-spin :loading="detailLoading">
        <a-descriptions v-if="detail" :column="2" bordered>
          <a-descriptions-item label="合同名称">{{ detail.contractName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="审批状态">
            <a-tag :color="statusColor(detail.approvalStatus)">
              {{ statusText(detail.approvalStatus) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="模板">{{ detail.templateName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="流程">{{ detail.flowName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="当前节点">{{ detail.currentNodeName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="正式合同">{{ detail.formalContractId || '未发起' }}</a-descriptions-item>
        </a-descriptions>

        <div v-if="detail" class="materials">
          <div class="section-title">审批材料</div>
          <a-space wrap>
            <a-button v-if="detail.pdfUrl" type="primary" @click="openDetailPdf">查看 PDF</a-button>
            <a-button v-if="detail.videoUrl" @click="openDetailVideo">查看视频</a-button>
            <a-button
              v-if="detail.approvalStatus === 4"
              status="warning"
              @click="detail && resubmitApproval(detail)"
            >
              重新编辑提交
            </a-button>
          </a-space>
        </div>

        <div v-if="detail" class="work-tree-section">
          <div class="section-title">审批工作树</div>
          <div class="work-tree">
            <div
              v-for="node in approvalWorkTree"
              :key="node.nodeKey"
              class="work-tree-node"
              :class="`work-tree-${node.state}`"
            >
              <div class="work-tree-marker">
                <span class="work-tree-dot">{{ node.marker }}</span>
              </div>
              <div class="work-tree-body">
                <div class="work-tree-main">
                  <span class="work-tree-name">{{ node.nodeName }}</span>
                  <a-tag size="small" :color="node.color">{{ node.nodeStatusText }}</a-tag>
                </div>
                <div class="work-tree-meta">{{ node.approverText }}</div>
                <div v-if="node.approveTime" class="work-tree-meta">{{ node.approveTime }}</div>
                <div v-if="node.comment" class="work-tree-comment">意见：{{ node.comment }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="detail" class="snapshot-section">
          <div class="section-title">填写参数</div>
          <a-table
            row-key="snapshotKey"
            :data="approvalComponents"
            :pagination="false"
            size="small"
            :bordered="false"
          >
            <template #columns>
              <a-table-column title="字段" data-index="name" />
              <a-table-column title="类型" :width="100">
                <template #cell="{ record }">
                  {{ record.componentType ?? '-' }}
                </template>
              </a-table-column>
              <a-table-column title="值" data-index="value" />
            </template>
          </a-table>
        </div>

        <div v-if="detail" class="snapshot-section">
          <div class="section-title">签署人信息</div>
          <a-table
            row-key="snapshotKey"
            :data="approvalSigners"
            :pagination="false"
            size="small"
            :bordered="false"
          >
            <template #columns>
              <a-table-column title="类型" :width="90">
                <template #cell="{ record }">
                  {{ signerTypeText(record) }}
                </template>
              </a-table-column>
              <a-table-column title="名称">
                <template #cell="{ record }">
                  {{ signerName(record) }}
                </template>
              </a-table-column>
              <a-table-column title="手机号" :width="150">
                <template #cell="{ record }">
                  {{ signerMobile(record) }}
                </template>
              </a-table-column>
              <a-table-column title="视频要求" :width="110">
                <template #cell="{ record }">
                  {{ record.requireVideo ? '需要' : '不需要' }}
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>

        <div v-if="detail" class="history">
          <div class="section-title">审批历史</div>
          <a-table
            row-key="id"
            :data="detail.tasks || []"
            :pagination="false"
            size="small"
            :bordered="false"
          >
            <template #columns>
              <a-table-column title="节点" data-index="nodeName" />
              <a-table-column title="审批人" :width="150">
                <template #cell="{ record }">{{ approverText(record) }}</template>
              </a-table-column>
              <a-table-column title="状态" :width="110">
                <template #cell="{ record }">
                  <a-tag :color="taskStatusColor(record.taskStatus)">
                    {{ taskStatusText(record.taskStatus) }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column title="意见" data-index="comment" />
              <a-table-column title="处理时间" data-index="approveTime" :width="180" />
            </template>
          </a-table>
        </div>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
  import { Message, Modal } from '@arco-design/web-vue';
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import {
    continueApprovalContract,
    getApprovalDetail,
    getMyApprovalRecords,
    type ContractApprovalRecord,
    type ContractApprovalTask,
    type ContractApprovalTreeNode,
  } from '@/api/contract-approval';
  import { getToken } from '@/utils/auth';

  const router = useRouter();
  const loading = ref(false);
  const detailLoading = ref(false);
  const detailVisible = ref(false);
  const records = ref<ContractApprovalRecord[]>([]);
  const detail = ref<ContractApprovalRecord>();

  const statusOptions = [
    { value: 2, label: '审批中', color: 'blue' },
    { value: 3, label: '审批通过', color: 'green' },
    { value: 4, label: '审批拒绝', color: 'red' },
    { value: 5, label: '已撤回', color: 'gray' },
    { value: 6, label: '已发起正式合同', color: 'arcoblue' },
  ];

  const statusText = (status?: number) =>
    statusOptions.find((item) => item.value === status)?.label || '未知';

  const statusColor = (status?: number) =>
    statusOptions.find((item) => item.value === status)?.color || 'gray';

  const taskStatusOptions = [
    { value: 0, label: '待审批', color: 'blue' },
    { value: 1, label: '已通过', color: 'green' },
    { value: 2, label: '已拒绝', color: 'red' },
    { value: 3, label: '已跳过', color: 'gray' },
  ];

  const taskStatusText = (status?: number) =>
    taskStatusOptions.find((item) => item.value === status)?.label || '未知';

  const taskStatusColor = (status?: number) =>
    taskStatusOptions.find((item) => item.value === status)?.color || 'gray';

  const approverText = (record: ContractApprovalTask) => {
    if (record.approverLabel) return record.approverLabel;
    if (record.approverPhone) return record.approverPhone;
    if (record.approverName) return record.approverName;
    if (record.approverRoleName) return record.approverRoleName;
    if (record.approverUserId) return `用户 ${record.approverUserId}`;
    if (record.approverRoleId) return `角色 ${record.approverRoleId}`;
    return '-';
  };

  const treeApproverText = (node: ContractApprovalTreeNode) => {
    const adminText = [node.approverUserName, node.approverUserPhone].filter(Boolean).join(' ');
    if (node.approverRoleName) {
      return adminText ? `角色组：${node.approverRoleName} / 处理人：${adminText}` : `角色组：${node.approverRoleName}`;
    }
    if (adminText) return `固定管理员：${adminText}`;
    if (node.approverUserId) return `固定管理员：${node.approverUserId}`;
    if (node.approverRoleId) return `角色组：${node.approverRoleId}`;
    return '处理主体：-';
  };

  const treeState = (node: ContractApprovalTreeNode) => {
    if (node.nodeStatus === 1) return 'done';
    if (node.nodeStatus === 2 || node.current) return 'active';
    if (node.nodeStatus === 3) return 'reject';
    if (node.nodeStatus === 4) return 'muted';
    return 'waiting';
  };

  const treeColor = (state: string) => {
    if (state === 'done') return 'green';
    if (state === 'active') return 'blue';
    if (state === 'reject') return 'red';
    return 'gray';
  };

  const approvalWorkTree = computed(() => {
    const tree = Array.isArray(detail.value?.approvalTree) ? detail.value?.approvalTree || [] : [];
    return tree.map((node, index) => {
      const state = treeState(node);
      return {
        nodeKey: `${node.nodeId || index}`,
        nodeName: node.nodeName || `审批节点 ${index + 1}`,
        nodeStatusText: node.nodeStatusText || taskStatusText(node.taskStatus),
        marker: node.nodeStatus === 1 ? '✓' : String(node.nodeOrder || index + 1),
        state,
        color: treeColor(state),
        approverText: treeApproverText(node),
        approveTime: node.approveTime,
        comment: node.comment,
      };
    });
  });

  type SnapshotRow = Record<string, any> & { snapshotKey?: string };

  const parseJsonArray = (text?: string): SnapshotRow[] => {
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed)
        ? parsed.map((item, index) => ({ ...item, snapshotKey: `${item?.id || item?.ctSignerId || index}` }))
        : [];
    } catch (e) {
      return [];
    }
  };

  const approvalComponents = computed(() => parseJsonArray(detail.value?.componentsJson));
  const approvalSigners = computed(() => parseJsonArray(detail.value?.signersJson));

  const signerTypeText = (record: SnapshotRow) => {
    if (record.type === 0 || record.signerType === 1) return '个人';
    if (record.type === 1 || record.signerType === 2) return '企业';
    return '-';
  };

  const signerName = (record: SnapshotRow) =>
    record.person?.name || record.company?.name || record.signerFlag || '-';

  const signerMobile = (record: SnapshotRow) =>
    record.person?.mobile || record.company?.agentMobile || '-';

  const fetchRecords = async () => {
    loading.value = true;
    try {
      const res = await getMyApprovalRecords();
      records.value = res.data || [];
    } finally {
      loading.value = false;
    }
  };

  const openDetail = async (record: ContractApprovalRecord) => {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const res = await getApprovalDetail(record.id);
      detail.value = res.data;
    } finally {
      detailLoading.value = false;
    }
  };

  const continueFormal = (record: ContractApprovalRecord) => {
    Modal.confirm({
      title: '审批通过',
      content: `确认使用已审批材料发起「${record.contractName || record.id}」？`,
      onOk: async () => {
        try {
          const res = await continueApprovalContract(record.id);
          Message.success('正式合同已发起');
          if (res.data?.signUrl) {
            Modal.confirm({
              title: '打开签署链接',
              content: '当前账号是签署方，可继续进入第三方签署页面。',
              okText: '打开签署',
              cancelText: '稍后处理',
              onOk: () => {
                if (res.data?.signUrl) {
                  window.open(res.data.signUrl, '_blank');
                }
              },
            });
          }
          fetchRecords();
        } catch {
          // The request interceptor has already shown the business error.
        }
      },
    });
  };

  const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

  const getManageAdminBase = () => {
    const configured = import.meta.env.VITE_MANAGE_ADMIN_URL;
    if (configured) {
      return trimTrailingSlash(configured);
    }
    const { protocol, hostname, port, origin } = window.location;
    if (port === '5175') {
      return `${protocol}//${hostname}:5174`;
    }
    if (hostname.includes('pc-admin')) {
      return `${protocol}//${hostname.replace('pc-admin', 'manage-admin')}${port ? `:${port}` : ''}`;
    }
    return origin;
  };

  const buildResubmitUrl = (record: ContractApprovalRecord) => {
    const params = new URLSearchParams();
    if (record.templateId) {
      params.set('tid', String(record.templateId));
    }
    params.set('approvalId', String(record.id));
    const token = getToken();
    if (token) {
      params.set('token', token);
    }
    return `${getManageAdminBase()}/contract?${params.toString()}`;
  };

  const resubmitApproval = (record: ContractApprovalRecord) => {
    if (!record.templateId) {
      Message.warning('审批记录缺少合同模板，不能重新提交');
      return;
    }
    router.push({
      name: 'iframeH5',
      query: {
        url: encodeURIComponent(buildResubmitUrl(record)),
      },
    });
  };

  const openUrl = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const openDetailPdf = () => {
    openUrl(detail.value?.pdfUrl);
  };

  const openDetailVideo = () => {
    openUrl(detail.value?.videoUrl);
  };

  onMounted(fetchRecords);
</script>

<style scoped lang="less">
  .container {
    padding: 20px;
  }

  .static-breadcrumb {
    margin-bottom: 16px;
    color: #86909c;
    font-size: 14px;
  }

  .breadcrumb-separator {
    margin: 0 8px;
  }

  .breadcrumb-item.current {
    color: #1d2129;
    font-weight: 500;
  }

  .general-card {
    border-radius: 8px;
  }

  .approval-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .approval-title {
    color: #1d2129;
    font-size: 20px;
    font-weight: 600;
  }

  .approval-desc,
  .contract-id {
    color: #86909c;
    font-size: 13px;
  }

  .contract-name {
    color: #1d2129;
    font-weight: 500;
  }

  .materials,
  .work-tree-section,
  .snapshot-section,
  .history {
    margin-top: 20px;
  }

  .section-title {
    margin-bottom: 12px;
    color: #1d2129;
    font-size: 16px;
    font-weight: 600;
  }

  .work-tree {
    display: grid;
    padding: 2px 0;
  }

  .work-tree-node {
    display: grid;
    grid-template-columns: 32px 1fr;
    column-gap: 10px;
    min-height: 78px;
  }

  .work-tree-marker {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .work-tree-node:not(:last-child) .work-tree-marker::after {
    position: absolute;
    top: 28px;
    bottom: 0;
    width: 1px;
    background: #e5e6eb;
    content: '';
  }

  .work-tree-dot {
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #f2f3f5;
    color: #4e5969;
    font-size: 13px;
    font-weight: 600;
  }

  .work-tree-body {
    padding-bottom: 16px;
  }

  .work-tree-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
  }

  .work-tree-name {
    color: #1d2129;
    font-weight: 600;
  }

  .work-tree-meta,
  .work-tree-comment {
    color: #4e5969;
    font-size: 13px;
    line-height: 20px;
  }

  .work-tree-done .work-tree-dot {
    background: #e8ffea;
    color: #00b42a;
  }

  .work-tree-active .work-tree-dot {
    background: #e8f3ff;
    color: #165dff;
  }

  .work-tree-reject .work-tree-dot {
    background: #ffece8;
    color: #f53f3f;
  }

</style>
