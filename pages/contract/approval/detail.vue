<template>
  <view class="page">
    <template v-if="token">
      <view class="summary">
        <view class="status" :class="'status-' + detail.approvalStatus">
          {{ statusText(detail.approvalStatus) }}
        </view>
        <view class="title">{{ detail.contractName || '-' }}</view>
        <view class="meta">{{ detail.flowName || '审批流程' }} · {{ detail.currentNodeName || '暂无当前节点' }}</view>
      </view>

      <view class="section">
        <view class="section-title">审批工作树</view>
        <view class="work-tree">
          <view
            v-for="node in approvalWorkTree"
            :key="node.nodeKey"
            class="work-tree-node"
            :class="'work-tree-' + node.state"
          >
            <view class="work-tree-marker">
              <text class="work-tree-dot">{{ node.marker }}</text>
            </view>
            <view class="work-tree-content">
              <view class="work-tree-main">
                <text class="work-tree-title">{{ node.nodeName }}</text>
                <text class="work-tree-status">{{ node.nodeStatusText }}</text>
              </view>
              <view class="work-tree-sub">{{ node.approverText }}</view>
              <view v-if="node.approveTime" class="work-tree-sub">{{ node.approveTime }}</view>
              <view v-if="node.comment" class="work-tree-comment">意见：{{ node.comment }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">审批材料</view>
        <view class="row">
          <text>模板</text>
          <text>{{ detail.templateName || '-' }}</text>
        </view>
        <view class="row">
          <text>提交时间</text>
          <text>{{ detail.submitTime || '-' }}</text>
        </view>
        <view class="row">
          <text>视频要求</text>
          <text>{{ detail.requireVideo ? '需要' : '不需要' }}</text>
        </view>
        <view v-if="detail.pdfUrl || detail.videoUrl" class="material-actions">
          <button
            v-if="detail.pdfUrl"
            class="file-action pdf-action"
            :disabled="pdfLoading"
            @click="openPdf(detail.pdfUrl)"
          >
            <view class="file-action-icon">PDF</view>
            <view class="file-action-main">
              <view class="file-action-title">{{ pdfLoading ? '正在打开' : '查看合同 PDF' }}</view>
              <view class="file-action-desc">打开审批材料原文</view>
            </view>
          </button>
          <button v-if="detail.videoUrl" class="secondary material-secondary" @click="openUrl(detail.videoUrl)">查看视频</button>
        </view>
      </view>

      <view class="section">
        <view class="section-title">签署人信息</view>
        <view v-if="signerRows.length">
          <view v-for="(signer, index) in signerRows" :key="index" class="snapshot-card">
            <view class="snapshot-main">
              <text>{{ signerName(signer) }}</text>
              <text class="snapshot-tag">{{ signerTypeText(signer) }}</text>
            </view>
            <view class="snapshot-sub">{{ signerMobile(signer) }}</view>
            <view class="snapshot-sub">视频要求：{{ signer.requireVideo ? '需要' : '不需要' }}</view>
          </view>
        </view>
        <view v-else class="empty-text">暂无签署人信息</view>
      </view>

      <view class="section">
        <view class="section-title">填写参数</view>
        <view v-if="componentRows.length">
          <view v-for="(component, index) in componentRows" :key="index" class="param-row">
            <text class="param-name">{{ component.name || '-' }}</text>
            <text class="param-value">{{ component.value || '-' }}</text>
          </view>
        </view>
        <view v-else class="empty-text">暂无填写参数</view>
      </view>

      <view class="section">
        <view class="section-title">审批历史</view>
        <view v-if="approvalTasks.length">
          <view v-for="task in approvalTasks" :key="task.id" class="task-card">
            <view class="task-main">
              <text>{{ task.nodeName || '-' }}</text>
              <text class="task-tag" :class="'task-tag-' + task.taskStatus">{{ taskStatusText(task.taskStatus) }}</text>
            </view>
            <view class="task-sub">{{ approverText(task) }}</view>
            <view v-if="task.comment" class="task-comment">意见：{{ task.comment }}</view>
            <view class="task-sub">{{ task.approveTime || task.createTime || '-' }}</view>
          </view>
        </view>
        <view v-else class="empty-text">暂无审批历史</view>
      </view>

      <view class="footer">
        <button v-if="detail.approvalStatus === 3" class="primary" :disabled="submitting" @click="continueFormal">
          审批通过
        </button>
        <button v-if="detail.approvalStatus === 4" class="secondary" @click="editAgain">
          重新编辑提交
        </button>
      </view>
    </template>

    <view v-else class="login-required">
      <view class="login-required-title">登录后查看审批详情</view>
      <view class="login-required-desc">审批材料、签署人快照、审批意见和审批通过入口仅登录后可查看。</view>
      <view class="login-required-btn" @click="goLogin">立即登录</view>
    </view>
  </view>
</template>

<script>
import { approvalDetail, continueApproval } from '@/api/contract-approval.js';
import config from '@/config/index.js';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      id: '',
      detail: {},
      submitting: false,
      pdfLoading: false,
    };
  },
  computed: {
    ...mapState(['token']),
    signerRows() {
      return this.safeJsonArray(this.detail.signersJson);
    },
    componentRows() {
      return this.safeJsonArray(this.detail.componentsJson);
    },
    approvalTasks() {
      return Array.isArray(this.detail.tasks) ? this.detail.tasks : [];
    },
    approvalWorkTree() {
      return this.buildWorkTree(this.detail);
    },
  },
  onLoad(options) {
    this.id = options.id || '';
    this.fetchDetail();
  },
  onShow() {
    this.fetchDetail();
  },
  methods: {
    goLogin() {
      this.common.toLogin();
    },
    async fetchDetail() {
      if (!this.token) {
        this.detail = {};
        return;
      }
      if (!this.id) return;
      this.detail = await approvalDetail(this.id);
    },
    safeJson(text) {
      if (!text) return [];
      try {
        return JSON.parse(text);
      } catch (e) {
        return [];
      }
    },
    safeJsonArray(text) {
      const parsed = this.safeJson(text);
      return Array.isArray(parsed) ? parsed : [];
    },
    signerTypeText(signer) {
      if (signer.type === 0 || signer.signerType === 1) return '个人';
      if (signer.type === 1 || signer.signerType === 2) return '企业';
      return '-';
    },
    signerName(signer) {
      return (signer.person && signer.person.name) || (signer.company && signer.company.name) || signer.signerFlag || '-';
    },
    signerMobile(signer) {
      return (signer.person && signer.person.mobile) || (signer.company && signer.company.agentMobile) || '-';
    },
    statusText(status) {
      const map = {
        2: '审批中',
        3: '审批通过',
        4: '审批拒绝',
        5: '已撤回',
        6: '已发起正式合同',
      };
      return map[status] || '未知';
    },
    taskStatusText(status) {
      const map = {
        0: '待审批',
        1: '已通过',
        2: '已拒绝',
        3: '已跳过',
      };
      return map[status] || '未知';
    },
    nodeStatusText(node) {
      if (node.nodeStatusText) return node.nodeStatusText;
      const map = {
        0: '待审批',
        1: '已通过',
        2: '审批中',
        3: '已拒绝',
        4: '已跳过',
      };
      return map[node.nodeStatus] || '未知';
    },
    workTreeState(node) {
      if (node.nodeStatus === 1) return 'done';
      if (node.nodeStatus === 2 || node.current) return 'active';
      if (node.nodeStatus === 3) return 'reject';
      if (node.nodeStatus === 4) return 'muted';
      return 'waiting';
    },
    workTreeApproverText(node) {
      if (node.approverRoleName) {
        const admin = `${node.approverUserName || ''} ${node.approverUserPhone || ''}`.trim();
        return admin ? `${node.approverRoleName} / ${admin}` : node.approverRoleName;
      }
      if (node.approverUserName || node.approverUserPhone) {
        return `${node.approverUserName || '管理员'} ${node.approverUserPhone || ''}`.trim();
      }
      if (node.nodeKey === 'submit') return '提交人';
      if (node.nodeKey === 'continue') return '用户后台';
      if (node.nodeKey === 'formal') return '第三方签署流程';
      return node.approverType === 2 ? '角色组' : '指定管理员';
    },
    buildWorkTree(record) {
      if (!record || !record.id) return [];
      const nodes = [
        {
          nodeKey: 'submit',
          nodeName: '提交审批',
          nodeStatus: 1,
          nodeStatusText: '已提交',
          marker: '✓',
          state: 'done',
          approverText: '提交人',
          approveTime: record.submitTime,
        },
      ];
      const approvalTree = Array.isArray(record.approvalTree) ? record.approvalTree : [];
      approvalTree.forEach((node, index) => {
        const state = this.workTreeState(node);
        nodes.push({
          nodeKey: `approval-${node.nodeId || index}`,
          nodeName: node.nodeName || `审批节点 ${index + 1}`,
          nodeStatus: node.nodeStatus,
          nodeStatusText: this.nodeStatusText(node),
          marker: node.nodeStatus === 1 ? '✓' : String(node.nodeOrder || index + 1),
          state,
          approverText: this.workTreeApproverText(node),
          approveTime: node.approveTime,
          comment: node.comment,
        });
      });
      if (record.approvalStatus === 3) {
        nodes.push({
          nodeKey: 'continue',
          nodeName: '审批通过',
          nodeStatus: 2,
          nodeStatusText: '待继续',
          marker: '续',
          state: 'active',
          approverText: '用户后台',
        });
      }
      if (record.formalContractId) {
        nodes.push({
          nodeKey: 'formal',
          nodeName: '正式合同',
          nodeStatus: 1,
          nodeStatusText: '已发起',
          marker: '✓',
          state: 'done',
          approverText: '第三方签署流程',
          comment: `合同ID：${record.formalContractId}`,
        });
      }
      return nodes;
    },
    approverText(task) {
      if (task.approverLabel) return task.approverLabel;
      if (task.approverPhone) return `审批人：${task.approverPhone}`;
      if (task.approverName) return `审批人：${task.approverName}`;
      if (task.approverRoleName) return `审批角色：${task.approverRoleName}`;
      if (task.approverUserId) return `审批人：${task.approverUserId}`;
      if (task.approverRoleId) return `审批角色：${task.approverRoleId}`;
      return '审批人：-';
    },
    resolveFileUrl(url) {
      const clean = String(url || '').trim();
      if (!clean) return '';
      if (/^https?:\/\//i.test(clean)) return clean;
      if (/^\/\//.test(clean)) return 'https:' + clean;
      if (clean.charAt(0) === '/') {
        return config.getBasicsUrl() + clean;
      }
      return clean;
    },
    copyUrl(url, title = '链接已复制') {
      if (!url) return;
      uni.setClipboardData({
        data: url,
        success: () => uni.showToast({ title, icon: 'none' }),
      });
    },
    openUrl(url) {
      if (!url) return;
      const fileUrl = this.resolveFileUrl(url);
      // #ifdef H5
      window.open(fileUrl, '_blank');
      // #endif
      // #ifndef H5
      this.copyUrl(fileUrl);
      // #endif
    },
    openPdf(url) {
      const fileUrl = this.resolveFileUrl(url);
      if (!fileUrl) {
        uni.showToast({ title: '暂无可查看的 PDF', icon: 'none' });
        return;
      }
      // #ifdef H5
      window.open(fileUrl, '_blank');
      // #endif
      // #ifndef H5
      if (this.pdfLoading) return;
      this.pdfLoading = true;
      uni.showLoading({ title: '打开 PDF...' });
      uni.downloadFile({
        url: fileUrl,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            uni.openDocument({
              filePath: res.tempFilePath,
              fileType: 'pdf',
              showMenu: true,
              fail: () => {
                this.copyUrl(fileUrl, 'PDF 链接已复制');
              },
            });
          } else {
            this.copyUrl(fileUrl, 'PDF 链接已复制');
          }
        },
        fail: () => {
          this.copyUrl(fileUrl, 'PDF 链接已复制');
        },
        complete: () => {
          this.pdfLoading = false;
          uni.hideLoading();
        },
      });
      // #endif
    },
    buildAuthorizePageUrl(path, options = {}) {
      const params = ['path=' + encodeURIComponent(path || '')];
      if (options.source) {
        params.push('source=' + encodeURIComponent(options.source));
      }
      if (options.contractId) {
        params.push('contractId=' + encodeURIComponent(options.contractId));
      }
      if (options.originType) {
        params.push('originType=' + encodeURIComponent(options.originType));
      }
      return '/pages/user/company/authorize?' + params.join('&');
    },
    async continueFormal() {
      this.submitting = true;
      try {
        const res = await continueApproval(this.id);
        if (res && res.status === false) {
          uni.showToast({ title: res.reason || '正式合同发起失败', icon: 'none' });
          return;
        }
        uni.showToast({ title: '正式合同已发起', icon: 'none' });
        if (res && res.isSigner && res.signUrl) {
          uni.setStorageSync('pending_sign_contract_id', res.id);
          setTimeout(() => {
            uni.redirectTo({
              url: this.buildAuthorizePageUrl(res.signUrl, {
                source: 'sign',
                contractId: res.id,
              }),
            });
          }, 600);
        } else if (res && res.id) {
          setTimeout(() => {
            uni.redirectTo({ url: `/pages/contract/detail/index?id=${res.id}` });
          }, 600);
        } else {
          this.fetchDetail();
        }
      } finally {
        this.submitting = false;
      }
    },
    editAgain() {
      if (!this.detail.templateId) return;
      uni.redirectTo({
        url: `/pages/contract/sign/signByTemplate?tid=${this.detail.templateId}&approvalId=${this.detail.id}`,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 28rpx;
  background: #f5f7fb;
}

.summary,
.section {
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 16rpx;
  background: #fff;
}

.status {
  display: inline-flex;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #2f6bff;
  font-size: 24rpx;
}

.status-3 {
  background: #e8f8ef;
  color: #168a4a;
}

.status-4 {
  background: #fff0ed;
  color: #d93026;
}

.status-6 {
  background: #f0f2f5;
  color: #4e5969;
}

.title {
  margin-top: 18rpx;
  color: #17233d;
  font-size: 36rpx;
  font-weight: 700;
}

.meta {
  margin-top: 10rpx;
  color: #7b8794;
  font-size: 26rpx;
}

.section-title {
  margin-bottom: 18rpx;
  color: #17233d;
  font-size: 30rpx;
  font-weight: 700;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 14rpx 0;
  color: #4e5969;
  font-size: 26rpx;
}

.snapshot-card {
  margin-bottom: 16rpx;
  padding: 18rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
}

.snapshot-main,
.param-row,
.task-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  color: #17233d;
  font-size: 26rpx;
}

.snapshot-tag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #2f6bff;
  font-size: 22rpx;
}

.snapshot-sub,
.task-sub,
.empty-text {
  margin-top: 8rpx;
  color: #7b8794;
  font-size: 24rpx;
}

.work-tree {
  overflow: hidden;
  border: 1rpx solid #eef0f4;
  border-radius: 12rpx;
}

.work-tree-node {
  display: flex;
  min-height: 112rpx;
  padding: 22rpx 20rpx 22rpx 0;
  border-bottom: 1rpx solid #eef0f4;
}

.work-tree-node:last-child {
  border-bottom: 0;
}

.work-tree-marker {
  position: relative;
  display: flex;
  flex: 0 0 68rpx;
  justify-content: center;
}

.work-tree-node:not(:last-child) .work-tree-marker::after {
  position: absolute;
  top: 42rpx;
  bottom: -23rpx;
  width: 1rpx;
  background: #d8e0ec;
  content: '';
}

.work-tree-dot {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38rpx;
  height: 38rpx;
  border: 2rpx solid #c8d2e0;
  border-radius: 50%;
  background: #ffffff;
  color: #7b8794;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.work-tree-content {
  flex: 1;
  min-width: 0;
}

.work-tree-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.work-tree-title {
  flex: 1;
  min-width: 0;
  color: #17233d;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.work-tree-status {
  flex-shrink: 0;
  color: #7b8794;
  font-size: 24rpx;
  line-height: 38rpx;
}

.work-tree-sub,
.work-tree-comment {
  margin-top: 8rpx;
  color: #7b8794;
  font-size: 24rpx;
  line-height: 36rpx;
  word-break: break-all;
}

.work-tree-comment {
  color: #4e5969;
}

.work-tree-done .work-tree-dot {
  border-color: #25b864;
  background: #25b864;
  color: #ffffff;
}

.work-tree-done .work-tree-status {
  color: #168a4a;
}

.work-tree-active .work-tree-dot {
  border-color: #317cff;
  background: #317cff;
  color: #ffffff;
}

.work-tree-active .work-tree-status {
  color: #2f6bff;
  font-weight: 600;
}

.work-tree-reject .work-tree-dot {
  border-color: #d93026;
  background: #d93026;
  color: #ffffff;
}

.work-tree-reject .work-tree-status {
  color: #d93026;
  font-weight: 600;
}

.task-card {
  margin-bottom: 16rpx;
  padding: 18rpx;
  border: 1rpx solid #eef0f4;
  border-radius: 12rpx;
  background: #ffffff;
}

.task-tag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #2f6bff;
  font-size: 22rpx;
}

.task-tag-1 {
  background: #e8f8ef;
  color: #168a4a;
}

.task-tag-2 {
  background: #fff0ed;
  color: #d93026;
}

.task-tag-3 {
  background: #f0f2f5;
  color: #4e5969;
}

.task-comment {
  margin-top: 10rpx;
  color: #4e5969;
  font-size: 24rpx;
  line-height: 36rpx;
  word-break: break-all;
}

.param-row {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eef0f4;
}

.param-row:last-child {
  border-bottom: 0;
}

.param-name {
  flex: 0 0 240rpx;
  color: #4e5969;
}

.param-value {
  flex: 1;
  text-align: right;
  word-break: break-all;
}

.footer {
  padding-bottom: 40rpx;
}

.login-required {
  margin-top: 96rpx;
  padding: 56rpx 36rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 34rpx rgba(38, 91, 160, 0.10);
}

.login-required-title {
  font-size: 34rpx;
  line-height: 46rpx;
  font-weight: 600;
  color: #17233d;
}

.login-required-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #5f6f89;
}

.login-required-btn {
  margin-top: 36rpx;
  width: 220rpx;
  height: 76rpx;
  line-height: 76rpx;
  text-align: center;
  border-radius: 8rpx;
  background: #317cff;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
}

button {
  border-radius: 12rpx;
}

.material-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 22rpx;
}

.file-action {
  display: flex;
  align-items: center;
  gap: 18rpx;
  width: 100%;
  min-height: 92rpx;
  margin: 0;
  padding: 18rpx 20rpx;
  border: 1rpx solid #dbe7ff;
  border-radius: 14rpx;
  background: linear-gradient(180deg, #ffffff, #f6f9ff);
  color: #17233d;
  line-height: 1;
  text-align: left;
  box-shadow: 0 6rpx 16rpx rgba(49, 124, 255, 0.08);
}

.file-action::after {
  border: 0;
}

.file-action[disabled] {
  opacity: 0.72;
}

.file-action-icon {
  display: flex;
  flex: 0 0 66rpx;
  align-items: center;
  justify-content: center;
  width: 66rpx;
  height: 66rpx;
  border-radius: 12rpx;
  background: #eaf2ff;
  color: #2f6bff;
  font-size: 22rpx;
  font-weight: 700;
}

.file-action-main {
  flex: 1;
  min-width: 0;
}

.file-action-title {
  color: #17233d;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 38rpx;
}

.file-action-desc {
  margin-top: 6rpx;
  color: #7b8794;
  font-size: 24rpx;
  line-height: 34rpx;
}

.material-secondary {
  width: 100%;
  margin: 0;
}

.material-secondary::after {
  border: 0;
}

.primary {
  background: #317cff;
  color: #fff;
}

.secondary {
  background: #eef4ff;
  color: #2f6bff;
}
</style>
