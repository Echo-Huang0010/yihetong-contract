<template>
  <navigator
    :url="canClick ? '/pages/contract/detail/index?id=' + item.id : ''"
    hover-class="none"
    class="item"
  >
    <view class="title">
      <image src="https://resource.yi-types.com/new-sign/img_contract_item_top.webp" class="title-bg" mode="widthFix" />
      <view class="title-content">
        <view class="left-bar"></view>
        <view class="name flex-1 text-elps">
          {{ item.name || '' }}
        </view>
        <view class="tag-status" :class="'status-' + item.state">
          {{ item.state | stateHandle }}
        </view>
      </view>
    </view>
    <view class="content">
      <view class="row">
        <view class="label-box initiator">
          <text class="label-text">发起方</text>
        </view>
        <view class="info">
          <view class="name">{{ item.initiatorName || '' }}</view>
          <view class="company" v-if="item.initiatorCompany">{{ item.initiatorCompany }}</view>
        </view>
      </view>
      
      <view class="row">
        <view class="label-box signer">
          <text class="label-text">签署方</text>
        </view>
        <view class="info">
          <view class="name">{{ item.signers }}</view>
          <view class="company" v-if="item.signerCompany">{{ item.signerCompany }}</view>
        </view>
      </view>
      
      <view class="time-row">
        <view class="time-block">
          <view class="time">{{ item.startTime || '' }}</view>
          <view class="time-label">发起时间</view>
        </view>
        <view class="divider"></view>
        <view class="time-block">
          <view class="time">{{ item.endTime || '' }}</view>
          <view class="time-label">截止时间</view>
        </view>
      </view>
      
      <!-- 底部按钮区域 -->
      <view class="action-bar" v-if="showActionBar" @click.stop>
        <view class="action-button" @click.stop="handleScanSign" v-if="showScanSign">
          <image src="/static/ic_scan.svg" class="button-icon" />
          <text class="action-text">扫码签</text>
        </view>
        <view class="flex-1"></view>
        <button class="action-button share-button" open-type="share" :data-item="JSON.stringify(item)" @click.stop>
          <image src="/static/ic_link.svg" class="button-icon" mode="aspectFit" />
          <text class="action-text">分享</text>
        </button>
        <view class="action-button" @click.stop="handleCancel" v-if="showCancel">
          <text class="action-text">撤销</text>
        </view>
        <!-- 暂时注释掉拒签按钮 -->
        <!-- <view class="action-button" @click.stop="handleReject" v-if="showReject">
          <text>拒签</text>
        </view> -->
      </view>
    </view>
  </navigator>
</template>

<script>
export default {
  props: {
    item: {
      default: {},
      type: Object,
    },
    canClick: {
      default: true,
      type: Boolean,
    },
  },
  computed: {
    // 是否显示底部按钮区域
    showActionBar() {
      return true; // 所有状态都显示底部按钮区域
    },
    // 是否显示扫码签按钮
    showScanSign() {
      return this.item.state === 0 || this.item.state === -2;
    },
    // 是否显示撤销按钮（待签署且是发起方）
    showCancel() {
      return (this.item.state === 0 || this.item.state === -2) && this.isInitiator;
    },
    // 是否显示拒签按钮（待签署且是签署方）
    showReject() {
      return (this.item.state === 0 || this.item.state === -2) && !this.isInitiator;
    },
    // 是否是发起方
    isInitiator() {
      // 这里需要根据实际业务逻辑判断是否是发起方
      // 假设item中有一个字段表示当前用户是否是发起方
      return this.item.isInitiator === true;
    }
  },
  methods: {
    handleScanSign(e) {
      this.$emit('scan-sign', this.item);
      e.preventDefault();
      e.stopPropagation();
    },
    handleCancel(e) {
      this.$emit('cancel', this.item);
      e.preventDefault();
      e.stopPropagation();
    },
    handleReject(e) {
      this.$emit('reject', this.item);
      e.preventDefault();
      e.stopPropagation();
    }
  }
};
</script>

<style lang="scss" scoped>
.item {
  overflow: hidden;
  position: relative;
  margin-bottom: 24rpx;
  border-radius: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.03);
  }
  
  .title {
    height: 104rpx;
    width: 690rpx;
    position: relative;
    
    .title-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    .title-content {
      position: relative;
      z-index: 2;
      height: 100%;
      padding: 0 30rpx;
      display: flex;
      align-items: center;
    }
    
    .left-bar {
      width: 6rpx;
      height: 30rpx;
      background-color: #317CFF;
      border-radius: 120rpx;
      margin-right: 10rpx;
    }
    
    .name {
      color: #353D4B;
      font-size: 30rpx;
      margin-right: 60rpx;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .tag-status {
     padding: 0;
      width: 114rpx;
      height: 50rpx;
      border-radius: 10rpx 20rpx 10rpx 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      align-self: auto;
      
      &.status-0, &.status--2 {
        background-color: #E7F1FF;
        color: #007BFF;
      }
      
      &.status-1 {
        background-color: #E4FFF5;
        color: #00C8BE;
      }
      
      &.status-2, &.status-3 {
        background-color: #FFEDEA;
        color: #317CFF;
      }
      
      &.status-4, &.status-5 {
        background-color: #F9F9F9;
        color: #8A8A8A;
      }
    }
  }

  .content {
    padding: 30rpx;
    background-color: white;
    border-radius: 0 0 30rpx 30rpx;

    .row {
      height: 100rpx;
      background-color: #F0F6FF;
      border-radius: 30rpx;
      display: flex;
      align-items: center;
      padding: 0 14rpx;
      margin-bottom: 20rpx;
      
      .label-box {
        width: 108rpx;
        height: 70rpx;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .label-text {
          color: white;
          font-size: 24rpx;
        }
        
        &.initiator {
          background-color: #317CFF;
        }
        
        &.signer {
          background-color: #22B9A0;
        }
      }
      
      .info {
        margin-left: 20rpx;
        
        .name {
          color: #353D4B;
          font-size: 28rpx;
        }
        
        .company {
          color: #6E7C93;
          font-size: 22rpx;
        }
      }
    }
    
    .time-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .time-block {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .time {
          color: #353D4B;
          font-size: 24rpx;
        }
        
        .time-label {
          color: #6E7C93;
          font-size: 22rpx;
          margin-top: 4rpx;
        }
      }
      
      .divider {
        width: 2rpx;
        height: 36rpx;
        background-color: #E5E5E5;
        margin: 0 30rpx;
      }
    }
    
    /* 底部按钮区域 */
    .action-bar {
      margin-top: 20rpx;
      display: flex;
      align-items: center;
      border-top: 2rpx solid #E7E7E7;
      padding-top: 20rpx;
      
      .action-button {
        height: 64rpx;
        border-radius: 20rpx;
        border: 2rpx solid #D4D4D4;
        padding: 0 22rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 16rpx;
        
        &:first-child {
          margin-left: 0;
        }
        
        .button-icon {
          width: 32rpx;
          height: 32rpx;
          margin-right: 8rpx;
        }
        
        .action-text {
          font-size: 26rpx;
          color: #353D4B;
        }
      }
      
      .share-button {
        background-color: transparent;
        font-size: 26rpx;
        line-height: normal;
        padding: 0 22rpx;
        margin: 0;
        margin-left: 16rpx;
        
        &::after {
          border: none;
        }
      }
      
      .flex-1 {
        flex: 1;
      }
    }
  }
}
</style>
