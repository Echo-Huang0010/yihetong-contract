<template>
  <view class="page">
    <view class="tabs-container">
      <scroll-view scroll-x class="tabs-scroll-view" :show-scrollbar="false" scroll-with-animation>
        <view class="tabs-button-group">
          <view
            v-for="(item, index) in list"
            :key="index"
            class="tab-button"
            :class="{ 'active': current === index }"
            @click="switchClick(index)"
          >
            {{ item.name }}
          </view>
        </view>
      </scroll-view>
    </view>
    <view
      class="approval-entry"
      :class="{ 'has-pending': approvalPendingCount > 0 }"
      @click="navigateTo('/pages/contract/approval/index')"
    >
      <view class="approval-icon-wrap">
        <uni-icons type="compose" size="20" color="#317CFF"></uni-icons>
        <view v-if="approvalPendingCount > 0" class="approval-red-dot"></view>
      </view>
      <view class="approval-content">
        <view class="approval-title-row">
          <view class="approval-title">预发起审批</view>
          <view v-if="approvalPendingCount > 0" class="approval-badge">
            {{ approvalPendingCount > 99 ? '99+' : approvalPendingCount }} 待处理
          </view>
        </view>
        <view class="approval-desc">
          审批通过后可发起正式合同
        </view>
      </view>
      <uni-icons type="right" size="18" color="#7A8AA0"></uni-icons>
    </view>

    <view class="contract-list" v-if="contract.length" :class="{ active: onChecking }">
      <view
        class="item-box"
        :class="{
          disabled:
            onChecking === true &&
            (item.disabled || (checkList.length === maxLength && item.checked !== true)),
        }"
        v-for="item in contract"
        :key="item.id"
        @click="check(item)"
      >
        <uni-icons
          v-if="item.checked === true"
          class="check-icon"
          type="checkbox-filled"
          size="22"
          color="#317CFF"
        ></uni-icons>
        <uni-icons
          v-else-if="item.disabled || checkList.length === maxLength"
          class="check-icon"
          type="smallcircle-filled"
          size="22"
          color="#9c9c9c"
        ></uni-icons>
        <uni-icons v-else class="check-icon" type="circle" size="22" color="#000000"></uni-icons>
        <contractCard
          :canClick="!onChecking"
          :item="item"
          @scan-sign="handleScanSign"
          @cancel="handleCancel"
        />
      </view>
    </view>

    <view v-if="onChecking === true" class="c-h"></view>
    <view
      class="check-box flex-sb"
      :class="{
        show: onChecking === true,
      }"
    >
      <view class="flex-fs" @click="onCheckAll">
        <uni-icons
          v-if="checkAll"
          class="icon"
          type="checkbox-filled"
          size="22"
          color="#317CFF"
        ></uni-icons>
        <uni-icons v-else class="icon" type="circle" size="22" color="#000000"></uni-icons>
        <text>全选</text>
      </view>

      <view class="flex-fs">
        <text>
          已选
          <text class="num">{{ checkList.length }}</text>
          项
        </text>
        <button type="primary" :disabled="checkList.length < 1" @click="onBatch">批量签署</button>
        <button type="default" @click="onClear">取消</button>
      </view>
    </view>

    <loadMore v-if="loading"></loadMore>
    <baseline v-if="showBaseline"></baseline>

    <view v-if="noData" class="empty-container flex-col">
      <BaseEmpty massage="暂无数据~">
        <view class="btn-primary" @click="navigateTo('/pages/contract/sign/index')">签署合同</view>
        </BaseEmpty>

    </view>
    <tabbar />
    <view
      class="batch-btn flex-ct"
      v-if="
        contract &&
        contract.length > 1 &&
        current < 3 &&
        userInfo &&
        (userInfo.batchSignPlan == 1 || userInfo.batchSignPlan == 2)
      "
      @click="onChecking = true"
      :class="{ show: !onChecking }"
    >
      <view>
        批量
        <view />
        签署
      </view>
    </view>

    <!-- 添加二维码弹窗 -->
    <uni-popup ref="qrCodePopup" type="center">
      <view class="qr-popup">
        <view class="qr-title">合同签署二维码</view>
        <view class="qr-content">
          <uqrcode ref="uqrcode" canvas-id="qrcode" :value="qrCodeUrl" :options="qrCodeOptions" @tap="copyLinkFromCanvas"></uqrcode>
        </view>
        <view class="qr-tip">请使用微信扫一扫</view>
        <button class="close-btn" @click="closeQrCode">关闭</button>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import contractCard from '../home/components/contractCard';
import userInfoApi from '@/api/api.js';
import { approvalMine } from '@/api/contract-approval.js';
import { getSignUrl } from '@/api/seal.js';
import config from '@/config/index.js';
import setting from '@/config/setting.js';

function urlHost(value) {
  const match = String(value || '').trim().match(/^https?:\/\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : '';
}

// 不需要导入uQRCode，可以直接使用
export default {
  components: {
    contractCard,
  },
  data() {
    return {
      contract: [],
      current: 0,
      maxLength: 10,
      list: [
        {
          id: 0,
          state: '',
          self: '',
          showStartWithMe: false,
          name: '全部',
        },
        {
          id: 7,
          state: '',
          self: '',
          showStartWithMe: true,
          name: '我发起的',
        },
        {
          id: 1,
          state: 0,
          self: 1,
          showStartWithMe: false,
          name: '待我处理',
        },
        {
          id: 2,
          state: 0,
          self: 0,
          showStartWithMe: false,
          name: '待他人处理',
        },
        {
          id: 3,
          state: 1,
          self: '',
          showStartWithMe: false,
          name: '已完成',
        },
        {
          id: 4,
          state: 2,
          self: '',
          showStartWithMe: false,
          name: '已拒签',
        },
        {
          id: 5,
          state: 3,
          self: '',
          showStartWithMe: false,
          name: '已撤销',
        },
        {
          id: 6,
          state: 4,
          self: '',
          showStartWithMe: false,
          name: '已逾期',
        },
      ],
      params: {
        pageNum: 1,
        pageSize: 10,
        state: '', // 0待处理,1已完成,2已拒签,3已撤销,4已逾期
        self: '', // 0查询他人,1查询自己,不传查询所有
        showStartWithMe: false,
      },
      hasMore: false,
      loading: true,
      onChecking: false,
      qrCodeUrl: '', // 二维码链接
      qrCodeOptions: {
        margin: 10,
        size: 300,
        backgroundColor: '#ffffff',
        foregroundColor: '#000000'
      },
      approvalPendingCount: 0,
      approvalBadgeLoading: false,
    };
  },
  computed: {
    noData() {
      return !this.loading && !this.contract.length;
    },
    showBaseline() {
      return !this.hasMore && !this.loading && this.params.pageNum > 1;
    },
    checkList() {
      return this.contract.filter(i => i.checked === true);
    },
    canCheckList() {
      return this.contract.filter(i => i.disabled === false);
    },
    checkAll() {
      return (
        this.checkList.length === this.maxLength ||
        (this.checkList.length === this.canCheckList.length && this.checkList.length > 0)
      );
    },
    ...mapState(['token', 'userInfo', 'brandConfig']),
    activeSetting() {
      return this.brandConfig || setting;
    },
  },
  onShow() {
    const type = uni.getStorageSync('contractType');
    if (type) {
      this.current = type;
      uni.removeStorageSync('contractType');
    }
    this.init();
    this.fetchApprovalBadge();
  },
  onHide() {
    setTimeout(() => {
      this.onClear();
    }, 300);
  },
  methods: {
    loadMore() {
      if (this.hasMore) {
        this.loading = true;
        this.params.pageNum++;
        this.getData();
      }
    },
    init() {
      this.loading = true;
      this.params.state = this.list[this.current].state;
      this.params.self = this.list[this.current].self;
      this.params.showStartWithMe = this.list[this.current].showStartWithMe;
      this.params.pageNum = 1;
      if (!this.token) {
        this.loading = false;
        this.approvalPendingCount = 0;
        return;
      }
      this.getData();
    },
    fetchApprovalBadge() {
      if (!this.token || this.approvalBadgeLoading) {
        if (!this.token) {
          this.approvalPendingCount = 0;
        }
        return;
      }
      this.approvalBadgeLoading = true;
      approvalMine({}, { silent: true })
        .then(records => {
          const list = Array.isArray(records) ? records : [];
          this.approvalPendingCount = list.filter(item => {
            const status = Number(item && item.approvalStatus);
            return status === 2 || status === 3;
          }).length;
        })
        .catch(() => {
          this.approvalPendingCount = 0;
        })
        .finally(() => {
          this.approvalBadgeLoading = false;
        });
    },
    getData() {
      this.hasMore = false;
      userInfoApi.contractList(this.params).then(data => {
        const rows = Array.isArray(data && data.rows) ? data.rows : [];
        const currentUser = this.userInfo || {};
        const batchSignPlan = Number(currentUser.batchSignPlan);
        data = data || {};
        data.rows = rows.map(item => {
          const signUrl = String(item.signUrl || '');
          item.disabled = false;
          item.isInitiator = item.initiatorId === currentUser.id;
          if (!signUrl || (item.state != 0 && item.state != -2)) {
            item.disabled = true;
          } else if (batchSignPlan === 1) {
            item.disabled = true;
          } else if (batchSignPlan === 2 && !urlHost(signUrl).endsWith('.h5.esign.cn')) {
            item.disabled = true;
          }
          return item;
        });
        if (this.params.pageNum == 1) {
          this.contract = data.rows;
        } else {
          this.contract = this.contract.concat(data.rows);
        }
        if (data.rows.length == this.params.pageSize) {
          this.hasMore = true;
        }
        this.loading = false;
        uni.stopPullDownRefresh();
      }).catch(() => {
        if (this.params.pageNum === 1) {
          this.contract = [];
        }
        this.loading = false;
        uni.stopPullDownRefresh();
      });
    },
    switchClick(index) {
      //导航切换
      this.current = index;
      this.contract = [];
      this.params.pageNum = 1;
      this.params.state = this.list[index].state;
      this.params.self = this.list[index].self;
      this.params.showStartWithMe = this.list[index].showStartWithMe;
      this.loading = true;
      if (!this.token) {
        this.loading = false;
        return;
      }
      this.onChecking = false;
      this.getData();
    },
    navigateTo(url) {
      if (this.token) {
        this.common.navigateTo(url);
      } else {
        this.common.toLogin();
      }
    },
    check(item) {
      if (!item.signUrl || (item.state != 0 && item.state != -2) || item.disabled) {
        return;
      }
      item.checked = item.checked === true ? false : true;
      this.contract = [].concat(this.contract);
    },
    onCheckAll() {
      let val;
      if (this.checkAll) val = this.checkAll;
      else val = this.checkList.length === this.maxLength;
      this.contract.forEach(i => {
        if (
          !i.signUrl ||
          (i.state != 0 && i.state != -2) ||
          this.checkList.length === this.maxLength ||
          i.disabled
        ) {
          i.checked = false;
        } else {
          i.checked = !val;
        }
        this.contract = [...this.contract, ...[]];
      });
    },
    onBatch() {
      const that = this;
      uni.showModal({
        content: `您正在批量签署${that.checkList.length}份合同，当您选择批量签署时，代表您已完全阅读并熟知并确认每一份文档的内容。`,
        confirmText: '确认',
        confirmColor: '#317CFF',
        success: function (res) {
          if (res.confirm) {
            if (that.userInfo.batchSignPlan == 2) {
              // batch sign via open platform, no redirect to avoid duplicate page
              const ids = that.checkList.map(i => {
                return i.id;
              });
              getSignUrl({
                ids: ids,
              }).then(res => {
                if (res) {
                  uni.navigateTo({
                    url: '/pages/user/company/authorize?path=' + encodeURIComponent(res),
                  });
                } else {
                  uni.showToast({
                    title: '签署链接获取失败！',
                    icon: 'none',
                  });
                }
              });
            } else {
              setTimeout(() => {
                uni.$emit('checkList', that.checkList);
              }, 200);
              uni.navigateTo({
                url: '/pages/contract/signByBatch/index',
              });
            }
          }
        },
      });
    },
    onClear() {
      this.onChecking = false;
      this.contract = this.contract.map(i => {
        i.checked = false;
        return i;
      });
    },
    handleScanSign(item) {
      console.log('扫码签收到的item:', item);

      // 检查item是否为字符串，如果是则解析为对象
      let itemData = item;
      if (typeof itemData === 'string') {
        try {
          itemData = JSON.parse(itemData);
          console.log('解析后的item:', itemData);
        } catch (error) {
          console.error('解析item失败:', error);
        }
      }

      if (!itemData || !itemData.id) {
        this.common.showToast('合同ID不存在');
        return;
      }

      // 生成新的二维码链接格式
      this.qrCodeUrl = `${config.getBasicsUrl()}/mp?id=${itemData.id}&uid=${this.userInfo.id}`;
      console.log('生成二维码链接:', this.qrCodeUrl);

      // 打开弹窗
      this.$refs.qrCodePopup.open();
    },
    closeQrCode() {
      this.$refs.qrCodePopup.close();
    },
    handleCancel(item) {
      console.log('撤销收到的item:', item);

      // 检查item是否为字符串，如果是则解析为对象
      let itemData = item;
      if (typeof itemData === 'string') {
        try {
          itemData = JSON.parse(itemData);
          console.log('解析后的item:', itemData);
        } catch (error) {
          console.error('解析item失败:', error);
        }
      }

      if (!itemData || !itemData.id) {
        this.common.showToast('合同ID不存在');
        return;
      }

      uni.showModal({
        title: '撤销确认',
        content: '确定要撤销该合同吗？撤销后无法恢复。',
        confirmColor: '#317CFF',
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '撤销中...'
            });

            userInfoApi.cancellationOfContract({}, itemData.id)
              .then(() => {
                uni.hideLoading();
                this.common.showToast('撤销成功');
                // 刷新列表
                this.params.pageNum = 1;
                this.loading = true;
                this.contract = [];
                this.getData();
              })
              .catch(err => {
                uni.hideLoading();
                this.common.showToast('撤销失败：' + (err.message || '未知错误'));
              });
          }
        }
      });
    },
    copyLinkFromCanvas() {
      if (this.qrCodeUrl) {
        uni.setClipboardData({
          data: this.qrCodeUrl,
          success: () => {
            this.common.showToast('链接已复制到剪贴板');
          }
        });
      }
    },
  },
  onReachBottom() {
    if (this.hasMore) {
      this.loading = true;
      this.params.pageNum++;
      this.getData();
    }
  },
  onPullDownRefresh() {
    this.loading = true;
    this.params.pageNum = 1;
    this.getData();
  },
  // 小程序分享功能
  onShareAppMessage(res) {
    console.log('分享', res);
    // 来自contractCard的分享按钮
    if (res.from === 'button' && res.target) {
      let itemData = res.target.dataset.item;
      console.log('item', itemData);

      // 检查item是否为字符串，如果是则解析为对象
      if (typeof itemData === 'string') {
        try {
          itemData = JSON.parse(itemData);
          console.log('解析后的item:', itemData);
        } catch (error) {
          console.error('解析item失败:', error);
        }
      }

      if (itemData && itemData.id) {
        // 生成分享参数
        const contractId = itemData.id;
        const userId = this.userInfo.id;

        console.log('分享合同:', contractId, '用户ID:', userId);

        return {
          title: itemData.name || '合同签署',
          // 直接在小程序路径中带上参数，进入小程序后会自动解析
          path: '/pages/index/index?id=' + contractId + '&uid=' + userId,
        };
      }
    }

    // 默认分享
    const share = (this.activeSetting && this.activeSetting.share) || setting.share;
    return {
      ...share,
      path: share.path || '/pages/index/index',
    };
  }
};
</script>

<style lang="scss" scoped>
.page {
  background: #F3F3F3;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  padding-bottom: 124rpx;

  .tabs-container {
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 24rpx;
    border-bottom: none;  /* 消除可能的底部边框 */

    .tabs-scroll-view {
      white-space: nowrap;
      width: 100%;
      /* 禁用滚动条样式 */
      ::-webkit-scrollbar {
        display: none;
        width: 0 !important;
        height: 0 !important;
        background: transparent;
      }
      /* 消除底部边框线 */
      border-bottom: none;
      overflow: hidden;
    }

    .tabs-button-group {
      display: flex;
      padding: 0 24rpx;
      height: 88rpx;
      /* 确保没有边框 */
      border-bottom: none;

      .tab-button {
        padding: 0 18rpx;
        margin-right: 16rpx;
        font-size: 28rpx;
        color: #353D4B;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.3s;
        flex-shrink: 0;

        &.active {
          color: #317CFF;
          font-weight: bold;
        }

        &.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 6rpx;
          background-color: #317CFF;
          border-radius: 3rpx;
        }
      }
    }
  }

  .contract-list {
    min-height: 100vh;
    padding: 32rpx;
    transition: all 0.3s;

    &.active {
      transform: translateX(58rpx);
    }

    .item-box {
      position: relative;
      margin-bottom: 24rpx;

      .check-icon {
        position: absolute;
        left: -28rpx;
        top: 50%;
        transform: translate(-100%, -50%);
      }

      &.disabled {
        opacity: 0.6;
      }
    }
  }

  .approval-entry {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin: 20rpx 28rpx 4rpx;
    padding: 24rpx 26rpx;
    border-radius: 16rpx;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: 0 6rpx 18rpx rgba(24, 37, 64, 0.06);
    transition: transform 0.16s ease, box-shadow 0.16s ease;

    &.has-pending {
      background: linear-gradient(180deg, #ffffff 0%, #fff8f7 100%);
    }

    &:active {
      transform: scale(0.99);
      box-shadow: 0 4rpx 12rpx rgba(24, 37, 64, 0.05);
    }
  }

  .approval-icon-wrap {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 68rpx;
    height: 68rpx;
    border-radius: 16rpx;
    background: #eaf2ff;
  }

  .approval-red-dot {
    position: absolute;
    top: -3rpx;
    right: -3rpx;
    width: 16rpx;
    height: 16rpx;
    border: 4rpx solid #ffffff;
    border-radius: 50%;
    background: #f04438;
  }

  .approval-content {
    flex: 1;
    min-width: 0;
  }

  .approval-title-row {
    display: flex;
    align-items: center;
    gap: 14rpx;
    min-width: 0;
  }

  .approval-title {
    flex: 0 1 auto;
    overflow: hidden;
    color: #17233d;
    font-size: 30rpx;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .approval-badge {
    flex: 0 0 auto;
    max-width: 190rpx;
    overflow: hidden;
    padding: 4rpx 12rpx;
    border-radius: 999rpx;
    background: #fff0ed;
    color: #d92d20;
    font-size: 22rpx;
    font-weight: 600;
    line-height: 30rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .approval-desc {
    margin-top: 6rpx;
    overflow: hidden;
    color: #667085;
    font-size: 24rpx;
    line-height: 34rpx;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-container {
    margin-top: 50rpx;

    .btn-primary {
      margin-top: 100rpx;
      width: 598rpx;
      height: 88rpx;
      border-radius: 16rpx;
      background: #317CFF;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      font-weight: bold;
      box-shadow: 0 6rpx 12rpx rgba(255, 101, 101, 0.2);
      transition: all 0.3s;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 3rpx 6rpx rgba(255, 101, 101, 0.1);
      }
    }
  }

  .batch-btn {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #317CFF, #317CFF);
    color: white;
    text-align: center;
    font-size: 24rpx;
    font-weight: bold;
    position: fixed;
    right: -170rpx;
    bottom: calc(constant(safe-area-inset-bottom) + 274rpx);
    bottom: calc(env(safe-area-inset-bottom) + 274rpx);
    z-index: 99;
    transition: all 0.3s;
    box-shadow: 0 8rpx 16rpx rgba(255, 101, 101, 0.3);

    &.show {
      right: 46rpx;
    }

    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 8rpx rgba(255, 101, 101, 0.2);
    }
  }

  .c-h {
    height: 54rpx;
  }

  .check-box {
    position: fixed;
    width: 100%;
    background: white;
    bottom: 124rpx;
    padding: 20rpx 30rpx;
    transform: translateY(300rpx);
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);

    &.show {
      transform: translateY(0);
    }

    .disabled {
      opacity: 0.6;
    }

    transition: all 0.3s;

    .icon {
      height: 20px;
    }

    text {
      color: #333333;
      font-size: 28rpx;

      &.num {
        font-weight: bold;
        color: #317CFF;
      }
    }

    button {
      line-height: 70rpx;
      border-radius: 16rpx;
      padding: 0 24rpx;
      font-size: 30rpx;
      margin-left: 28rpx;
      color: white;
      transition: all 0.3s;

      &:active {
        transform: scale(0.98);
      }
    }

    button[type='primary'] {
      background: #317CFF;
      box-shadow: 0 4rpx 8rpx rgba(255, 101, 101, 0.2);
    }

    button[type='default'] {
      border: 1px solid #e1ecff;
      color: #666666;
      margin-left: 14rpx;
      background: rgba(255, 101, 101, 0.05);
    }

    button[disabled] {
      opacity: 0.65;
    }
  }

  @supports (bottom: constant(safe-area-inset-bottom)) {
    .check-box {
      bottom: calc(124rpx + constant(safe-area-inset-bottom) - 20rpx);
    }
    .c-h {
      height: calc(54rpx + constant(safe-area-inset-bottom) - 20rpx);
    }
  }

  @supports (bottom: env(safe-area-inset-bottom)) {
    .check-box {
      bottom: calc(124rpx + env(safe-area-inset-bottom) - 20rpx);
    }
    .c-h {
      height: calc(54rpx + env(safe-area-inset-bottom) - 20rpx);
    }
  }
}

// 二维码弹窗样式
.qr-popup {
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  box-sizing: border-box;

  .qr-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #353D4B;
    text-align: center;
    margin-bottom: 30rpx;
  }

  .qr-content {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20rpx;
  }

  .qr-tip {
    font-size: 26rpx;
    color: #6E7C93;
    text-align: center;
    margin-bottom: 30rpx;
  }

  .close-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    background: #317CFF;
    color: #FFFFFF;
    border-radius: 16rpx;
    font-size: 30rpx;
    font-weight: bold;
  }
}
</style>
