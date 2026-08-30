<template>
  <view class="page">
    <view class="header">
      <view class="title">审批记录</view>
      <view class="subtitle">预发起审批通过后，可发起正式合同</view>
    </view>

    <template v-if="token">
      <view v-if="records.length" class="list">
        <view v-for="item in records" :key="item.id" class="record" @click="goDetail(item.id)">
          <view class="record-top">
            <view class="record-main">
              <view class="record-name">{{ item.contractName || '-' }}</view>
              <view class="record-meta">{{ item.templateName || '合同模板' }}</view>
            </view>
            <view class="record-side">
              <view class="status" :class="'status-' + item.approvalStatus">
                {{ statusText(item.approvalStatus) }}
              </view>
              <view class="time">{{ item.submitTime || '' }}</view>
            </view>
          </view>
          <view class="progress-summary">
            <view
              v-for="step in approvalProgress(item)"
              :key="step.key"
              class="progress-step"
              :class="'progress-' + step.state"
            >
              <view class="progress-dot">{{ step.index }}</view>
              <view class="progress-label">{{ step.label }}</view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!loading && !records.length" class="empty">
        <view class="empty-title">暂无审批记录</view>
        <view class="empty-desc">需要审批的模板提交后会出现在这里</view>
      </view>
    </template>

    <view v-else class="login-required">
      <view class="login-required-title">登录后查看审批记录</view>
      <view class="login-required-desc">审批中、审批通过和被拒绝的合同会集中展示在这里。</view>
      <view class="login-required-btn" @click="goLogin">立即登录</view>
    </view>
  </view>
</template>

<script>
import { approvalMine } from '@/api/contract-approval.js';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      loading: false,
      records: [],
    };
  },
  computed: {
    ...mapState(['token']),
  },
  onShow() {
    this.fetchRecords();
  },
  methods: {
    goLogin() {
      this.common.toLogin();
    },
    async fetchRecords() {
      if (!this.token) {
        this.records = [];
        this.loading = false;
        return;
      }
      this.loading = true;
      try {
        const res = await approvalMine();
        this.records = Array.isArray(res) ? res : [];
      } finally {
        this.loading = false;
      }
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
    approvalProgress(item) {
      const status = item.approvalStatus;
      const approvalLabelMap = {
        2: item.currentNodeName || '当前审批',
        3: '审批通过',
        4: '审批拒绝',
        5: '已撤回',
        6: '审批通过',
      };
      const finalLabelMap = {
        2: '等待审批',
        3: '审批通过',
        4: '流程结束',
        5: '流程结束',
        6: '正式合同',
      };
      const approvalState = status === 2 ? 'active' : status === 4 ? 'reject' : status === 5 ? 'muted' : 'done';
      const finalState = status === 6 ? 'done' : status === 3 ? 'active' : status === 4 ? 'reject' : 'waiting';
      return [
        { key: 'submit', index: 1, label: '提交审批', state: 'done' },
        { key: 'approval', index: 2, label: approvalLabelMap[status] || '审批节点', state: approvalState },
        { key: 'formal', index: 3, label: finalLabelMap[status] || '正式合同', state: finalState },
      ];
    },
    goDetail(id) {
      uni.navigateTo({
        url: `/pages/contract/approval/detail?id=${id}`,
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

.header {
  margin-bottom: 24rpx;
}

.title {
  color: #17233d;
  font-size: 40rpx;
  font-weight: 700;
}

.subtitle {
  margin-top: 8rpx;
  color: #7b8794;
  font-size: 26rpx;
}

.record {
  margin-bottom: 20rpx;
  padding: 28rpx;
  border: 1rpx solid #edf0f5;
  border-radius: 16rpx;
  background: #fff;
}

.record-top {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.record-main {
  min-width: 0;
}

.record-name {
  overflow: hidden;
  color: #17233d;
  font-size: 30rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-meta,
.time {
  margin-top: 8rpx;
  color: #8a96a3;
  font-size: 24rpx;
}

.record-side {
  flex-shrink: 0;
  text-align: right;
}

.progress-summary {
  display: flex;
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid #eef0f4;
}

.progress-step {
  position: relative;
  flex: 1;
  min-width: 0;
  text-align: center;
}

.progress-step:not(:last-child)::after {
  position: absolute;
  top: 13rpx;
  left: calc(50% + 24rpx);
  right: calc(-50% + 24rpx);
  height: 2rpx;
  background: #d8e0ec;
  content: '';
}

.progress-dot {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #c8d2e0;
  border-radius: 50%;
  background: #ffffff;
  color: #7b8794;
  font-size: 20rpx;
  line-height: 28rpx;
}

.progress-label {
  overflow: hidden;
  margin-top: 10rpx;
  color: #7b8794;
  font-size: 22rpx;
  line-height: 30rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-done .progress-dot {
  border-color: #25b864;
  background: #25b864;
  color: #ffffff;
}

.progress-done .progress-label {
  color: #168a4a;
}

.progress-active .progress-dot {
  border-color: #317cff;
  background: #317cff;
  color: #ffffff;
}

.progress-active .progress-label {
  color: #2f6bff;
  font-weight: 600;
}

.progress-reject .progress-dot {
  border-color: #d93026;
  background: #d93026;
  color: #ffffff;
}

.progress-reject .progress-label {
  color: #d93026;
  font-weight: 600;
}

.progress-muted .progress-dot,
.progress-waiting .progress-dot {
  border-color: #c8d2e0;
  background: #ffffff;
  color: #7b8794;
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

.empty {
  margin-top: 160rpx;
  text-align: center;
}

.empty-title {
  color: #17233d;
  font-size: 32rpx;
  font-weight: 600;
}

.empty-desc {
  margin-top: 12rpx;
  color: #8a96a3;
  font-size: 26rpx;
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
</style>
