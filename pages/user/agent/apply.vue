<template>
  <view class="page-base">
    <!-- 顶部背景图 -->
    <image class="bg-image" :src="agentApplyBackground" mode="aspectFill" @error="handleBackgroundError" />
    
    <!-- 底部弹窗样式 -->
    <view class="bottom-modal">
      <!-- 标题部分 -->
      <view class="section-header">
        <view class="indicator"></view>
        <text class="header-title">开启功能权限</text>
      </view>
      
      <!-- 功能特权区域 -->
      <view class="features-container">
        <!-- 特权1：自主分配合同份额 -->
        <view class="feature-item">
          <image class="feature-icon" src="/static/ic_agent_1.svg" mode="aspectFit" />
          <view class="feature-info">
            <text class="feature-title">自主分配合同份额</text>
            <text class="feature-desc">开通权限后可享合同份额自主分配</text>
          </view>
          <image class="feature-check" src="/static/ic_agent_checked.svg" mode="aspectFit" />
        </view>
        
        <!-- 特权2：高比例销售分佣 -->
        <view class="feature-item">
          <image class="feature-icon" src="/static/ic_agent_1.svg" mode="aspectFit" />
          <view class="feature-info">
            <text class="feature-title">高比例销售分佣</text>
            <text class="feature-desc">开通权限后可享受高比例销售分佣</text>
          </view>
          <image class="feature-check" src="/static/ic_agent_checked.svg" mode="aspectFit" />
        </view>
      </view>
      
      <!-- 申请按钮 -->
      <button class="apply-btn" @click="showReasonPopup">申请成为代理</button>
    </view>
    
    <!-- 申请原因弹窗 -->
    <uni-popup ref="reasonPopup" type="center">
      <view class="reason-popup">
        <view class="reason-title">申请原因</view>
        <textarea class="reason-input" v-model="applyReason" placeholder="请输入申请成为代理的原因" maxlength="200"></textarea>
        <view class="reason-count">{{applyReason.length}}/200</view>
        <view class="reason-btns">
          <button class="reason-btn cancel" @click="cancelApply">取消</button>
          <button class="reason-btn confirm" @click="submitApply" :disabled="loading">确认</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import distributorApi from '@/api/distributor.js';

const DEFAULT_AGENT_APPLY_BACKGROUND = 'https://resource.yi-types.com/new-sign/yaoqing_bg.webp';

export default {
  data() {
    return {
      loading: false,
      applyReason: '',
      backgroundLoadFailed: false,
    };
  },
  computed: {
    ...mapState(['token', 'userInfo', 'brandConfig']),
    agentApplyBackground() {
      const config = this.brandConfig || {};
      return this.backgroundLoadFailed ? DEFAULT_AGENT_APPLY_BACKGROUND : (config.agentApplyBackground || DEFAULT_AGENT_APPLY_BACKGROUND);
    },
  },
  methods: {
    handleBackgroundError() {
      this.backgroundLoadFailed = true;
    },
    // 显示申请原因弹窗
    showReasonPopup() {
      this.$refs.reasonPopup.open();
    },
    
    // 取消申请
    cancelApply() {
      this.$refs.reasonPopup.close();
      this.applyReason = '';
    },
    
        // 提交申请
    submitApply() {
      if (!this.applyReason.trim()) {
        uni.showToast({
          title: '请输入申请原因',
          icon: 'none'
        });
        return;
      }
      
      if (this.loading) return;
      this.loading = true;
      
      // 关闭弹窗
      this.$refs.reasonPopup.close();
      
      // 显示加载提示
      uni.showLoading({
        title: '提交申请中...'
      });
      
      // 调用申请代理API
      distributorApi.applyDistributor({
        userId: this.userInfo.id || 0,
        userName: this.userInfo.nickname || '',
        applyReason: this.applyReason
      })
        .then(res => {
          // 申请成功
          uni.showToast({
            title: '申请已提交，请等待审核',
            icon: 'none',
            duration: 2000,
            success: () => {
              // 延迟返回上一页
              setTimeout(() => {
                uni.navigateBack();
              }, 2000);
            }
          });
        })
        .catch(err => {
          // 申请失败
          uni.showToast({
            title: err.msg || '申请失败，请稍后重试',
            icon: 'none'
          });
        })
        .finally(() => {
          uni.hideLoading();
          this.loading = false;
          this.applyReason = '';
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.page-base {
  min-height: 100vh;
  position: relative;
  width: 100%;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 920rpx;
  z-index: 1;
}

.bottom-modal {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 720rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx 30rpx 0 0;
  padding: 30rpx;
  box-sizing: border-box;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  margin-top: 50rpx;
  margin-bottom: 34rpx;
  
  .indicator {
    width: 6rpx;
    height: 30rpx;
    background-color: #317CFF;
    border-radius: 3rpx;
    margin-right: 8rpx;
  }
  
  .header-title {
    font-size: 30rpx;
    color: #353D4B;
    font-weight: 500;
  }
}

.features-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.feature-item {
  height: 140rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  padding-right: 30rpx;
  margin-bottom: 40rpx;
  
  .feature-icon {
    width: 64rpx;
    height: 64rpx;
    margin-left: 40rpx;
  }
  
  .feature-info {
    flex: 1;
    margin-left: 34rpx;
    display: flex;
    flex-direction: column;
    
    .feature-title {
      font-size: 28rpx;
      color: #353D4B;
      font-weight: bold;
      margin-bottom: 8rpx;
    }
    
    .feature-desc {
      font-size: 22rpx;
      color: #353D4B;
    }
  }
  
  .feature-check {
    width: 44rpx;
    height: 44rpx;
  }
}

.apply-btn {
  width: 100%;
  height: 88rpx;
  background-color: #317CFF;
  border-radius: 30rpx;
  color: #FFFFFF;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  margin-bottom: 30rpx;
}

/* 申请原因弹窗样式 */
.reason-popup {
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  
  .reason-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #353D4B;
    text-align: center;
    margin-bottom: 30rpx;
  }
  
  .reason-input {
    width: 100%;
    height: 240rpx;
    background-color: #F9F9F9;
    border-radius: 8rpx;
    padding: 20rpx;
    box-sizing: border-box;
    font-size: 28rpx;
    color: #353D4B;
  }
  
  .reason-count {
    text-align: right;
    font-size: 24rpx;
    color: #999999;
    margin-top: 10rpx;
  }
  
  .reason-btns {
    display: flex;
    justify-content: space-between;
    margin-top: 30rpx;
    
    .reason-btn {
      width: 240rpx;
      height: 80rpx;
      border-radius: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      
      &.cancel {
        background-color: #F5F5F5;
        color: #666666;
      }
      
      &.confirm {
        background-color: #317CFF;
        color: #FFFFFF;
        
        &:disabled {
          opacity: 0.6;
        }
      }
    }
  }
}
</style> 
