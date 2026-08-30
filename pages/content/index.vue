<template>
  <view class="page-base">
    <!-- 顶部渐变背景 -->
    <view class="top-bg"></view>
    <custom-nav title="企业服务" :showBack="false" class="service-nav"></custom-nav>
    
    <view class="container">
      <!-- 服务助手部分 -->
      <view class="service-assistant">
        <!-- 使用image替代CSS背景 -->
        <image class="assistant-bg" src="/static/bg_service_top.svg" mode="aspectFill" />
        <image class="robot-icon" src="/static/ic_service_dialog_robot.svg" mode="aspectFit" />
        <image class="service-bubble" src="/static/bg_click_to_service.svg" mode="aspectFit" @click="showServiceDialog" />
        <view class="assistant-content">
          <text class="assistant-title">您好！我是{{ activeSetting.appName || '一合通' }}企业服务助手</text>
          <text class="assistant-desc">下方为您提供快捷的企业服务，请根据需要选择。</text>
        </view>
        
        <!-- 快捷按钮 -->
        <view class="quick-buttons">
          <view class="quick-btn pink" @click="navigateToSelected">
            <image src="/static/ic_service_content.svg" mode="aspectFit" />
            <text>甄选内容</text>
          </view>
          <view class="quick-btn blue" @click="navigateToDocumentList">
            <image src="/static/ic_service_notes.svg" mode="aspectFit" />
            <text>文书模板</text>
          </view>
          <view class="quick-btn cyan" @click="navigateToMyNotes">
            <image src="/static/ic_service_my_notes.svg" mode="aspectFit" />
            <text>我的文书</text>
          </view>
        </view>
      </view>
      
      <!-- 服务类型部分 -->
      <view class="service-types">
        <view class="section-header">
          <view class="indicator"></view>
          <text class="service-section-title">服务类型</text>
        </view>
        
        <view class="services-grid">
          <view class="service-item" v-for="(item, index) in services" :key="index" @click="navigateToDetail(item.id)">
            <image class="service-icon" :src="item.iconUrl || serviceIconFallback" mode="aspectFit" @error="handleServiceIconError(item)" />
            <text class="service-name">{{ item.title }}</text>
          </view>
        </view>
        <!-- 加载中状态 -->
        <view class="loading-container" v-if="loading && services.length === 0">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        <!-- 空状态 -->
        <view class="empty-container" v-if="!loading && services.length === 0">
          <text class="empty-text">暂无服务类型</text>
        </view>
      </view>
      
      <!-- 数据分析部分 -->
      <view class="data-analysis">
        <image class="analysis-bg" src="/static/bg_service_top.svg" mode="aspectFill" />
        
        <view class="tags-container">
          <view v-for="(tag, index) in dataTags" :key="index" 
                :class="['tag', index >= dataTags.length - (dataTags.length % 3 || 3) ? 'no-margin' : '']" 
                @click="openPdfUrl(tag.url)">
            {{ tag.name }}
          </view>
        </view>
      </view>
    </view>
    
    <!-- 服务助手弹窗 -->
    <view class="service-dialog-mask" v-if="showDialog" @click="hideServiceDialog">
      <view class="service-dialog-container" @click.stop>
        <image class="dialog-bg" src="/static/bg_service_dialog.svg" mode="aspectFit" />
        
        <view class="dialog-content">
          <view class="circle-avatar">
            <image class="robot-avatar" src="/static/ic_service_dialog_robot.svg" mode="aspectFit" />
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
    
    <tabbar />
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { getContentList } from '@/api/news.js';
import { getServiceTypeList } from '@/api/content.js';
import customNav from '@/components/custom-nav/custom-nav.vue';
import setting from '@/config/setting.js';
import { SERVICE_ICON_FALLBACK, normalizeServiceRows } from '@/utils/content-assets.js';

export default {
  components: {
    customNav
  },
  data() {
    return {
      showDialog: false,
      selectedContent: [
        { type: 'guide', name: '操作指南', icon: '/static/ic_guide.svg' },
        { type: 'case', name: '经典案例', icon: '/static/ic_case.svg' },
        { type: 'hot', name: '热点推送', icon: '/static/ic_hot.svg' }
      ],
      documents: [
        { type: 'legal', name: '法律文书', icon: '/static/ic_legal.svg' }
      ],
      services: [],
      loading: false,
      serviceIconFallback: SERVICE_ICON_FALLBACK,
      dataTags: [
        { id: 'panorama', name: '企业全景报告示例报告', url: 'https://resource.yi-types.com/business-report/%E4%BC%81%E4%B8%9A%E5%85%A8%E6%99%AF%E6%8A%A5%E5%91%8A%E7%A4%BA%E4%BE%8B%E6%8A%A5%E5%91%8A.pdf' },
        { id: 'due_diligence', name: '企业尽调报告示例报告', url: 'https://resource.yi-types.com/business-report/%E4%BC%81%E4%B8%9A%E5%B0%BD%E8%B0%83%E6%8A%A5%E5%91%8A%E7%A4%BA%E4%BE%8B%E6%8A%A5%E5%91%8A.pdf' },
        { id: 'invest', name: '投资尽调报告示例报告', url: 'https://resource.yi-types.com/business-report/%E6%8A%95%E8%B5%84%E5%B0%BD%E8%B0%83%E6%8A%A5%E5%91%8A%E7%A4%BA%E4%BE%8B%E6%8A%A5%E5%91%8A.pdf' },
        { id: 'tax', name: '税务风险报告', url: 'https://resource.yi-types.com/business-report/%E7%A8%8E%E5%8A%A1%E9%A3%8E%E9%99%A9%E6%8A%A5%E5%91%8A.pdf' },
        { id: 'operation', name: '经营参谋报告示例报告', url: 'https://resource.yi-types.com/business-report/%E7%BB%8F%E8%90%A5%E5%8F%82%E8%B0%8B%E6%8A%A5%E5%91%8A%E7%A4%BA%E4%BE%8B%E6%8A%A5%E5%91%8A.pdf' },
        { id: 'subsidy', name: '财政补贴报告示例报告', url: 'https://resource.yi-types.com/business-report/%E8%B4%A2%E6%94%BF%E8%A1%A5%E8%B4%B4%E6%8A%A5%E5%91%8A%E7%A4%BA%E4%BE%8B%E6%8A%A5%E5%91%8A.pdf' }
      ]
    };
  },
  computed: {
    ...mapState(['token', 'brandConfig']),
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
  },
  mounted() {
    this.getServiceTypes();
  },
  methods: {
    handleServiceIconError(item) {
      if (item && item.iconUrl !== SERVICE_ICON_FALLBACK) {
        this.$set(item, 'iconUrl', SERVICE_ICON_FALLBACK);
      }
    },
    // 显示服务助手弹窗
    showServiceDialog() {
      this.showDialog = true;
    },
    
    // 隐藏服务助手弹窗
    hideServiceDialog() {
      this.showDialog = false;
    },
    
    // 获取服务类型列表
    async getServiceTypes() {
      this.loading = true;
      try {
        const res = await getServiceTypeList();
        console.log('res',res);
        // 直接使用返回的数组
        if (Array.isArray(res)) {
          this.services = normalizeServiceRows(res);
        } else if (res && res.code === 0 && res.data) {
          // 兼容标准响应格式
          this.services = normalizeServiceRows(res.data);
        } else {
          console.error('获取服务类型列表失败:', res);
          uni.showToast({
            title: '获取服务类型列表失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取服务类型列表异常:', error);
        uni.showToast({
          title: '获取服务类型列表失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    // 跳转到甄选内容页面
    navigateToSelected() {
      uni.navigateTo({
        url: '/pages/content/selected'
      });
    },
    // 跳转到分类页面
    navigateToDocumentList() {
        uni.navigateTo({
          url: '/pages/user/template/document-list'
        });
      
    },
    // 跳转到列表页面
    navigateToList(type, subType) {
      uni.navigateTo({
        url: `/pages/content/list?type=${type}&subType=${subType}`
      });
    },
    // 跳转到详情页面
    navigateToDetail(id) {
      uni.navigateTo({
        url: `/pages/content/service-detail?id=${id}`
      });
    },
    // 跳转到我的文书
    navigateToMyNotes() {
      uni.navigateTo({
        url: '/pages/user/template/my-documents'
      });
    },
    // 打开PDF链接
    openPdfUrl(url) {
      // #ifdef H5
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
      return;
      // #endif
      // 下载并打开PDF
      uni.showLoading({
        title: '加载中...'
      });
      
      uni.downloadFile({
        url: url,
        success: function (res) {
          var filePath = res.tempFilePath;
          uni.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function (res) {
              console.log('打开文档成功');
            },
            fail: function(err) {
              console.error('打开文档失败', err);
              uni.showToast({
                title: '打开文档失败',
                icon: 'none'
              });
            }
          });
        },
        fail: function(err) {
          console.error('下载文件失败', err);
          uni.showToast({
            title: '下载文件失败',
            icon: 'none'
          });
        },
        complete: function () {
          uni.hideLoading();
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.page-base {
  min-height: 100vh;
  background-color: #F3F3F3;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  position: relative;
}

.top-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 480rpx;
  background: linear-gradient(to bottom right, #FFDEDE, #F3F3F3);
  z-index: 0;
}

:deep(.service-nav) {
  width: 100%;
  background: transparent !important;
  background-color: transparent !important;
  border-bottom-color: transparent !important;
  
  .nav-title {
    color: #333333;
    font-weight: bold;
  }
  
  .nav-back {
    color: #333333;
    
    .uni-icons {
      color: #333333 !important;
    }
  }
}

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 30rpx;
  padding-top: calc(var(--status-bar-height) + 120rpx + 20rpx);
  padding-bottom: 120rpx;
  position: relative;
  z-index: 1;
}

/* 服务助手部分 */
.service-assistant {
  position: relative;
  border-radius: 30rpx;
  margin-bottom: 32rpx;
  z-index: 1;
  overflow: hidden;
  width: 100%;
  
  .assistant-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  
  .robot-icon {
    width: 147rpx;
    height: 210rpx;
    margin-left: 62rpx;
    margin-top: 14rpx;
  }
  
  .service-bubble {
    width: 328rpx;
    height: 72rpx;
    position: absolute;
    right: 0;
  }
  
  .assistant-content {
    position: absolute;
    top: 94rpx; /* 22rpx + service-bubble的位置 */
    left: 280rpx; /* 62rpx + 147rpx + 60rpx */
    margin-right: 18rpx;
    
    .assistant-title {
      display: block;
      font-size: 28rpx;
      color: #353D4B;
      margin-bottom: 10rpx;
    }
    
    .assistant-desc {
      display: block;
      font-size: 22rpx;
      color: #353D4B;
    }
  }
  
  .quick-buttons {
    display: flex;
    justify-content: space-between;
    margin: 10rpx 30rpx 30rpx 30rpx;
    
    .quick-btn {
      display: flex;
      align-items: center;
      width: 30%;
      height: 90rpx;
      border-radius: 20rpx;
      padding: 0 20rpx;
      
      image {
        width: 36rpx;
        height: 36rpx;
        margin-right: 12rpx;
      }
      
      text {
        font-size: 24rpx;
        color: #353D4B;
      }
      
      &.pink {
        background-color: #FFF4F4;
      }
      
      &.blue {
        background-color: #F0F3FF;
      }
      
      &.cyan {
        background-color: #EBFFFF;
      }
    }
  }
}

/* 服务类型部分 */
.service-types {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  padding: 32rpx 30rpx;
  margin-bottom: 30rpx;
  z-index: 1;
  position: relative;
  
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 52rpx;
    
    .indicator {
      width: 6rpx;
      height: 30rpx;
      background-color: #FF6565;
      border-radius: 3rpx;
      margin-right: 8rpx;
    }
    
    .service-section-title {
      font-size: 30rpx;
      color: #353D4B;
      font-weight: 500;
    }
  }
  
  .services-grid {
    display: flex;
    flex-wrap: wrap;
    
    .service-item {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 70rpx;
      
      .service-icon {
        width: 52rpx;
        height: 52rpx;
        margin-bottom: 30rpx;
      }
      
      .service-name {
        font-size: 26rpx;
        color: #353D4B;
      }
    }
    
    /* 处理最后一排的项目，移除底部边距 */
    .service-item:nth-last-child(-n+4) {
      margin-bottom: 0;
    }
  }
}

/* 数据分析部分 */
.data-analysis {
  background-color: #FFFFFF;
  border-radius: 30rpx;
  padding-bottom: 30rpx;
  z-index: 1;
  position: relative;
  overflow: hidden;
  
  .analysis-bg {
    width: 100%;
    height: 220rpx;
    display: block;
  }
  
  .tags-container {
    padding: 20rpx 20rpx 0 20rpx;
    display: flex;
    flex-wrap: wrap;
    
    .tag {
      background-color: #F9F9F9;
      border-radius: 10rpx;
      padding: 20rpx;
      margin: 0 20rpx 20rpx 0;
      font-size: 22rpx;
      color: #353D4B;
      
      &.no-margin {
        margin-bottom: 0;
      }
    }
  }
}

/* 加载状态和空状态 */
.loading-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top: 4rpx solid #FF6565;
  border-radius: 50%;
  margin-bottom: 20rpx;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 24rpx;
  color: #999999;
}

.empty-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
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
  background-color: #FF6565;
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
