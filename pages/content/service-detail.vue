<template>
  <view class="service-detail-page">
    <view class="cover-section">
      <image
        v-if="serviceCover"
        class="background-image"
        :src="serviceCover"
        mode="aspectFill"
        @error="coverLoadError = true"
      />
      <view v-else class="cover-placeholder">
        <image v-if="serviceDetail.iconUrl" class="cover-icon" :src="serviceDetail.iconUrl" mode="aspectFit" />
        <text class="cover-title">{{ serviceDetail.title || '企业服务' }}</text>
      </view>
    </view>
    
    <!-- 服务详情信息卡片 -->
    <view class="info-card">
      <view class="price-row">
        <text class="price-symbol">¥</text>
        <text class="price-value">{{ formatPrice(serviceDetail.price) }}</text>
        <text class="price-unit">/{{ serviceDetail.count }}次</text>
      </view>
      <text class="service-title">{{ serviceDetail.title }}</text>
      <text class="service-description">{{ serviceDetail.description }}</text>
    </view>
    
    <!-- 产品介绍卡片 -->
    <view class="intro-card">
      <view class="intro-header">
        <view class="intro-indicator"></view>
        <text class="intro-title">产品介绍</text>
      </view>
      <view class="divider"></view>
      <view class="intro-content">
        <rich-text :nodes="processedContent"></rich-text>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="support" @click="showServiceDialog">
        <image class="support-icon" src="/static/ic_service_kefu.svg" mode="aspectFit" />
        <text class="support-text">联系客服</text>
      </view>
      <view class="submit-btn" @click="submitService">
        <text>提交服务</text>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-spinner" />
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 服务申请弹窗 -->
    <uni-popup ref="servicePopup" type="bottom">
      <view class="service-popup">
        <view class="popup-header">
          <view class="header-indicator"></view>
          <text class="header-title">保密协议</text>
        </view>
        
        <view class="form-item">
          <view class="input-field">
            <text class="input-label">您的姓名</text>
            <input 
              class="input-control" 
              placeholder="请输入" 
              placeholder-style="color: #6E7C93; font-size: 26rpx;"
              v-model="formData.name"
              style="text-align: right;"
            />
          </view>
        </view>
        
        <view class="form-item">
          <view class="input-field">
            <text class="input-label">您的手机号码</text>
            <input 
              class="input-control" 
              placeholder="请输入" 
              placeholder-style="color: #6E7C93; font-size: 26rpx;"
              type="number"
              maxlength="11"
              v-model="formData.mobile"
              style="text-align: right;"
            />
          </view>
        </view>
        
        <view class="form-item">
          <view class="textarea-container">
            <view class="textarea-field">
              <text class="textarea-label">问题描述</text>
              <textarea 
                class="textarea-control" 
                placeholder="请输入您的问题描述" 
                placeholder-style="color: #6E7C93; font-size: 26rpx;"
                v-model="formData.description"
              />
            </view>
          </view>
        </view>
        
        <view class="popup-submit-btn" @click="handleSubmitForm">
          <text>提交服务</text>
        </view>
      </view>
    </uni-popup>
    
    <!-- 服务助手弹窗 -->
    <view class="service-dialog-mask" v-if="showDialog" @click="hideServiceDialog">
      <view class="service-dialog-container" @click.stop>
        <image class="dialog-bg" src="/static/bg_service_dialog.svg" mode="aspectFit" />
        
        <view class="dialog-content">
          <view class="circle-avatar">
            <image class="robot-avatar" src="https://resource.yi-types.com/new-sign/ic_ai_robot.webp" mode="aspectFit" />
          </view>
          
          <text class="dialog-title">专属企业服务小助手</text>
          <text class="dialog-subtitle">限时免费体验</text>
          
          <image
            v-if="customerServiceQrCode"
            class="qrcode-image"
            show-menu-by-longpress
            :src="customerServiceQrCode"
            mode="aspectFit"
          />
          <view v-else class="service-contact-fallback">
            <text v-for="item in customerServiceContacts" :key="item">{{ item }}</text>
          </view>
          <text class="qrcode-tip">{{ customerServiceQrCode ? '长按或扫码联系客服' : '请按上述方式联系客服' }}</text>
        </view>
        
        <image class="close-button" src="/static/ic_dialog_close.svg" mode="aspectFit" @click="hideServiceDialog" />
      </view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { getServiceTypeDetail, applyService } from '@/api/content.js';
import customNav from '@/components/custom-nav/custom-nav.vue';
import setting from '@/config/setting.js';
import { processRichText } from '@/utils/richText.js';

export default {
  components: {
    customNav
  },
  data() {
    return {
      id: '',
      loading: false,
      showDialog: false,
      coverLoadError: false,
      serviceDetail: {
        id: 0,
        title: '',
        iconUrl: '',
        price: 0,
        count: 1,
        backgroundUrl: '',
        description: '',
        content: '',
        sort: 0,
        createTime: '',
        updateTime: ''
      },
      processedContent: '',
      formData: {
        name: '',
        mobile: '',
        description: ''
      }
    };
  },
  onLoad(options) {
    if (options.id) {
      this.id = options.id;
      this.getServiceDetail();
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  computed: {
    ...mapState(['brandConfig']),
    activeSetting() {
      return this.brandConfig || setting;
    },
    customerServiceQrCode() {
      return String(this.activeSetting.customerServiceQrCode || '').trim();
    },
    customerServiceContacts() {
      const contacts = [];
      const phone = String(this.activeSetting.telphone || '').trim();
      const weixin = String(this.activeSetting.weixin || '').trim();
      if (phone) contacts.push(`客服电话：${phone}`);
      if (weixin) contacts.push(`客服微信：${weixin}`);
      return contacts.length ? contacts : ['客服信息暂未配置'];
    },
    serviceCover() {
      if (this.coverLoadError) {
        return '';
      }
      return this.serviceDetail.backgroundUrl || this.serviceDetail.iconUrl || '';
    },
  },
  methods: {
    // 显示服务助手弹窗
    showServiceDialog() {
      this.showDialog = true;
    },
    
    // 隐藏服务助手弹窗
    hideServiceDialog() {
      this.showDialog = false;
    },
    
    // 获取服务详情
    async getServiceDetail() {
      this.loading = true;
      try {
        const res = await getServiceTypeDetail(this.id);
        console.log('res',res);
        this.coverLoadError = false;
        this.serviceDetail = res || this.serviceDetail;
        // 处理富文本内容
        this.processedContent = processRichText(this.serviceDetail.content);
      } catch (error) {
        console.error('获取服务详情异常:', error);
        uni.showToast({
          title: '获取服务详情失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 格式化价格
    formatPrice(price) {
      if (!price && price !== 0) return '0.00';
      return price.toFixed(2);
    },
    
    // 提交服务 - 打开弹窗
    submitService() {
      // 用户未登录时跳转到登录页
      if (!this.$store.state.token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
        return;
      }
      
      // 打开服务申请弹窗
      this.$refs.servicePopup.open();
    },
    
    // 处理表单提交
    async handleSubmitForm() {
      // 表单验证
      if (!this.formData.name.trim()) {
        uni.showToast({
          title: '请输入您的姓名',
          icon: 'none'
        });
        return;
      }
      
      if (!this.formData.mobile || !/^1\d{10}$/.test(this.formData.mobile)) {
        uni.showToast({
          title: '请输入正确的手机号码',
          icon: 'none'
        });
        return;
      }
      
      try {
        uni.showLoading({
          title: '提交中...'
        });
        
        // 构造请求参数
        const params = {
          serviceTypeId: this.serviceDetail.id,
          name: this.formData.name,
          mobile: this.formData.mobile,
          description: this.formData.description || ''
        };
        
        // 发送请求
        const result = await applyService(params);
        
        if (result) {
          uni.showToast({
            title: '服务申请已提交',
            icon: 'success'
          });
          
          // 关闭弹窗并清空表单
          this.$refs.servicePopup.close();
          this.formData = {
            name: '',
            mobile: '',
            description: ''
          };
        } else {
          uni.showToast({
            title: result.message || '提交失败，请重试',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('提交服务申请失败:', error);
        uni.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.service-detail-page {
  min-height: 100vh;
  background-color: #F3F3F3;
  padding-bottom: 140rpx;
  overflow-x: hidden;
}

.cover-section {
  width: 100%;
  height: 520rpx;
  background-color: #EAF1FF;
  overflow: hidden;
}

.background-image {
  width: 100%;
  height: 100%;
  display: block;
}

.cover-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.cover-icon {
  width: 128rpx;
  height: 128rpx;
  margin-bottom: 24rpx;
}

.cover-title {
  font-size: 34rpx;
  color: #353D4B;
  font-weight: 600;
  text-align: center;
}

.info-card {
  position: relative;
  margin-top: -56rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
  margin-bottom: 30rpx;
  padding: 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  z-index: 2;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .price-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 22rpx;
    
    .price-symbol {
      font-size: 28rpx;
      color: #317CFF;
      font-weight: bold;
    }
    
    .price-value {
      font-size: 48rpx;
      color: #317CFF;
      font-weight: bold;
      margin-right: 14rpx;
    }
    
    .price-unit {
      font-size: 22rpx;
      color: #353D4B;
    }
  }
  
  .service-title {
    font-size: 30rpx;
    color: #353D4B;
    font-weight: 500;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .service-description {
    font-size: 24rpx;
    color: #353D4B;
    line-height: 1.6;
    display: block;
  }
}

.intro-card {
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  z-index: 2;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .intro-header {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    
    .intro-indicator {
      width: 6rpx;
      height: 30rpx;
      background-color: #317CFF;
      border-radius: 3rpx;
      margin-right: 8rpx;
    }
    
    .intro-title {
      font-size: 30rpx;
      color: #353D4B;
      font-weight: 500;
    }
  }
  
  .divider {
    height: 1rpx;
    background-color: #E8E8E8;
    margin-bottom: 30rpx;
  }
  
  .intro-content {
    font-size: 26rpx;
    color: #353D4B;
    line-height: 1.6;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100rpx;
  padding: 0 30rpx;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 10;
  
  .support {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .support-icon {
      width: 40rpx;
      height: 40rpx;
    }
    
    .support-text {
      margin-top: 10rpx;
      font-size: 22rpx;
      color: #353D4B;
    }
  }
  
  .submit-btn {
    height: 76rpx;
    padding: 0 60rpx;
    background-color: #317CFF;
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    margin-left: 40rpx;

    
    text {
      color: #FFFFFF;
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.loading-mask {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
  
  .loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid rgba(255, 101, 101, 0.2);
    border-top: 6rpx solid #317CFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #353D4B;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 服务申请弹窗样式 */
.service-popup {
  background-color: #FFFFFF;
  height: 920rpx;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  padding: 30rpx;
  box-sizing: border-box;
}

.popup-header {
  display: flex;
  align-items: center;
  margin-bottom: 44rpx;
  
  .header-indicator {
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

.form-item {
  margin-bottom: 30rpx;
}

.input-field {
  height: 88rpx;
  border-radius: 30rpx;
  border: 1px solid #E7E7E7;
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #353D4B;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
}

.input-label {
  font-size: 30rpx;
  color: #353D4B;
  flex-shrink: 0;
}

.input-control {
  flex: 1;
  height: 100%;
  margin-left: 20rpx;
  font-size: 26rpx;
}

.textarea-container {
  width: 100%;
}

.textarea-field {
  position: relative;
  height: 400rpx;
  width: 100%;
  border-radius: 30rpx;
  border: 1px solid #E7E7E7;
  padding: 30rpx;
  box-sizing: border-box;
}

.textarea-label {
  font-size: 30rpx;
  color: #353D4B;
  display: block;
  margin-bottom: 20rpx;
}

.textarea-control {
  width: 100%;
  height: 330rpx;
  font-size: 26rpx;
  color: #353D4B;
}

.popup-submit-btn {
  height: 76rpx;
  width: 100%;
  background-color: #317CFF;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    color: #FFFFFF;
    font-size: 28rpx;
    font-weight: 500;
  }
}

/* 服务助手弹窗 */
.service-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.service-dialog-container {
  position: relative;
  width: 630rpx;
  height: 900rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dialog-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
}

.dialog-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10rpx;
}

.circle-avatar {
  width: 190rpx;
  height: 190rpx;
  background-color: #317CFF;
  border-radius: 85rpx;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.robot-avatar {
  width: 148rpx;
  height: 160rpx;
}

.dialog-title {
  margin-top: 34rpx;
  font-size: 30rpx;
  color: #353D4B;
}

.dialog-subtitle {
  margin-top: 14rpx;
  font-size: 30rpx;
  color: #353D4B;
}

.qrcode-image {
  margin-top: 18rpx;
  width: 428rpx;
  height: 428rpx;
}

.service-contact-fallback {
  width: 428rpx;
  min-height: 180rpx;
  margin-top: 58rpx;
  padding: 36rpx 28rpx;
  box-sizing: border-box;
  border-radius: 22rpx;
  background: rgba(49, 124, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18rpx;

  text {
    max-width: 100%;
    font-size: 28rpx;
    line-height: 1.5;
    color: #353D4B;
    text-align: center;
    word-break: break-all;
  }
}

.qrcode-tip {
  margin-top: 32rpx;
  font-size: 30rpx;
  color: #353D4B;
}

.close-button {
  width: 62rpx;
  height: 62rpx;
  margin-top: 64rpx;
}
</style>
