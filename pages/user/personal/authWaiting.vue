<!--
 * @Description: 认证状态等待页面
 * @LastEditTime: 2023-11-02 18:22:04
 * @LastEditors: 
 * @Author: 
 * @Date: 2023-11-02 18:22:04
-->
<template>
  <view class="waiting-container">
    <view class="waiting-content">
      <view class="status-icon">
        <uni-icons v-if="authState === 2" type="checkmarkempty" size="60" color="#52c41a"></uni-icons>
        <uni-icons v-else-if="authState === 3" type="closeempty" size="60" color="#f5222d"></uni-icons>
        <image v-else src="/static/legacy/asset-origin-a/images/loading.gif" class="loading-icon"></image>
      </view>
      
      <view class="waiting-title color-base bold text-32">{{ statusTitle }}</view>
      <view class="waiting-text color-grey-minor text-28">{{ statusText }}</view>
      
      <view class="btn-container">
        <view class="poll-indicator flex-ct" v-if="authState === 1">
          <view class="dot" v-for="i in 3" :key="i" :class="{'active': (pollCount % 3) === i-1}"></view>
        </view>
        
        <view class="btn btn-primary" @click="checkStatus" v-if="authState === 1">立即刷新</view>
        <view class="btn btn-primary" @click="navigateBack" v-else>{{ btnText }}</view>
        
        <view class="btn btn-cancel" @click="exitWaiting" v-if="authState === 1">退出等待</view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import userInfoApi from '@/api/api.js';

export default {
  data() {
    return {
      pollTimer: null,
      pollCount: 0,
      maxPollCount: 20, // 最多轮询20次
      statusTitle: '认证状态同步中',
      statusText: '正在同步认证结果，请稍候...',
      btnText: '返回',
      contractId: '',
      originType: '',
      authState: 1, // 1:处理中 2:成功 3:失败
      authObj: null
    };
  },
  computed: {
    ...mapState(['userInfo']),
  },
  onLoad(options) {
    // 获取页面参数
    if (options.id) {
      this.contractId = options.id;
    } else {
      // 尝试从存储中获取
      this.contractId = uni.getStorageSync('auth_contract_id') || '';
    }
    
    if (options.originType) {
      this.originType = options.originType;
    } else {
      // 尝试从存储中获取
      this.originType = uni.getStorageSync('auth_origin_type') || '';
    }
    
    console.log('认证等待页面参数: contractId=', this.contractId, 'originType=', this.originType);
    
    // 开始轮询
    this.startPolling();
  },
  onUnload() {
    // 清除轮询
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  },
  methods: {
    ...mapActions(['uinfo']),

    syncAuthState() {
      const type = this.originType === 'sign' ? 7 : 6;
      return userInfoApi.getAuthState({
        type,
        params: this.contractId || ''
      }, { silent: true }).catch(err => {
        console.log('sync auth state failed:', err);
        return null;
      });
    },
    
    startPolling() {
      this.pollCount = 0;
      this.checkStatus(); // 立即执行一次
      
      this.pollTimer = setInterval(() => {
        this.pollCount++;
        this.checkStatus();
        
        // 最多轮询20次（约1分钟）
        if (this.pollCount >= this.maxPollCount) {
          clearInterval(this.pollTimer);
          this.statusTitle = '同步超时';
          this.statusText = '认证状态同步超时，请手动刷新或返回页面';
          this.btnText = '返回';
        }
      }, 3000); // 每3秒检查一次
    },
    
    checkStatus() {
      // 调用用户信息接口获取认证状态
      this.syncAuthState().then(() => this.uinfo()).then(() => {
        console.log('当前认证状态:', this.userInfo.authentication);
        
        // 检查认证状态
        if (this.userInfo && this.userInfo.authentication) {
          // 认证成功
          this.authState = 2;
          this.statusTitle = '认证成功';
          this.statusText = '恭喜您，认证已成功完成！';
          this.btnText = '继续';
          
          // 设置本地缓存，标记认证成功
          if (this.contractId) {
            uni.setStorageSync('auth_success_' + this.contractId, true);
          } else {
            // 没有合同ID，设置一个通用的认证成功标记
            uni.setStorageSync('auth_success_general', true);
          }
          
          // 停止轮询
          if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
          }
          
          // 1.5秒后自动跳转
          console.log('认证成功，准备自动跳转');
          setTimeout(() => {
            console.log('执行自动跳转');
            this.forceNavigate();
          }, 1500);
        } else {
          // 认证中或失败，继续轮询
          this.statusText = `正在同步认证结果(${this.pollCount+1}/${this.maxPollCount})...`;
        }
      }).catch(err => {
        console.error('获取用户信息失败:', err);
      });
    },
    
    // 添加强制跳转方法，确保能关闭页面
    forceNavigate() {
      // 清除存储的认证等待状态
      uni.removeStorageSync('auth_waiting');
      uni.removeStorageSync('auth_poll_time');
      uni.removeStorageSync('auth_contract_id');
      uni.removeStorageSync('auth_origin_type');
      
      // 强制关闭所有页面并跳转
      try {
        if (this.originType === 'sign' && this.contractId) {
          uni.reLaunch({
            url: '/pages/contract/detail/index?id=' + this.contractId,
            success: () => {
              console.log('跳转成功:合同详情');
            },
            fail: (err) => {
              console.error('跳转失败:', err);
              // 失败后尝试回到首页
              uni.reLaunch({
                url: '/pages/home/index'
              });
            }
          });
        } else if (this.originType === 'mine') {
          uni.reLaunch({
            url: '/pages/user/index',
            success: () => {
              console.log('跳转成功:我的');
            },
            fail: (err) => {
              console.error('跳转失败:', err);
              uni.reLaunch({
                url: '/pages/home/index'
              });
            }
          });
        } else {
          // 默认跳转到首页
          uni.reLaunch({
            url: '/pages/home/index',
            success: () => {
              console.log('跳转成功:首页');
            }
          });
        }
      } catch (e) {
        console.error('跳转异常:', e);
        // 出现异常，尝试简单跳转
        uni.reLaunch({
          url: '/pages/home/index'
        });
      }
    },
    
    navigateBack() {
      this.forceNavigate();
    },
    
    exitWaiting() {
      // 停止轮询
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
      
      console.log('用户手动退出等待');
      // 使用强制跳转
      this.forceNavigate();
    }
  }
};
</script>

<style lang="scss" scoped>
.waiting-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.waiting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  width: 80%;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.status-icon {
  margin: 40rpx 0;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  width: 120rpx;
  height: 120rpx;
}

.waiting-title {
  margin-bottom: 20rpx;
  text-align: center;
}

.waiting-text {
  margin-bottom: 60rpx;
  text-align: center;
}

.btn-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.poll-indicator {
  margin-bottom: 30rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #d9d9d9;
  margin: 0 8rpx;
  transition: all 0.3s;
}

.dot.active {
  background-color: #FF6565;
  transform: scale(1.2);
}

.btn {
  width: 100%;
  height: 88rpx;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.btn-cancel {
  width: 100%;
  height: 88rpx;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  background-color: #f5f5f5;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
}
</style>
