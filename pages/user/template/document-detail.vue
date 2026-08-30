<template>
  <view class="document-detail-page">
    <!-- 文书基本信息 -->
    <view class="basic-info-card">
      <view class="document-header">
        <text class="document-title">{{ documentData.title }}</text>
      </view>
      <view class="divider"></view>
      <view class="document-intro">
        <text class="intro-text">简介:{{ documentData.summary }}</text>
      </view>
    </view>
    
    <!-- 文书正文部分 -->
    <view class="content-section">
      <view class="content-header" :style="{ backgroundImage: 'url(https://resource.yi-types.com/new-sign/img_contract_item_top.webp)' }">
        <view class="header-indicator"></view>
        <text class="header-title">文书正文</text>
      </view>
      <view class="document-content">
        <rich-text class="rich-document-content" :nodes="documentData.content"></rich-text>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <view class="action-item" @click="navigateToMyDocuments">
        <image class="action-icon" src="https://resource.yi-types.com/new-sign/ic_my_document.webp" mode="aspectFit" />
        <text class="action-text">我的文书</text>
      </view>
      
      <button class="action-item" open-type="share" style="line-height: 1.4;">
        <image class="action-icon" src="https://resource.yi-types.com/new-sign/ic_document_share.webp" mode="aspectFit" />
        <text class="action-text">分享</text>
      </button>
      
      <view class="action-item" @click="copyDownloadLink">
        <image class="action-icon" src="https://resource.yi-types.com/new-sign/ic_download_link.webp" mode="aspectFit" />
        <text class="action-text">下载链接</text>
      </view>
      
      <view class="download-btn" @click="downloadDocument">
        <text>下载文书</text>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-spinner" />
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
import { processRichText } from '@/utils/richText.js';
import { getDocumentDetail, getDocumentDownloadUrl } from '@/api/content.js';

export default {
  data() {
    return {
      id: '',
      loading: false,
      documentData: {
        title: '',
        summary: '',
        content: '',
        fileUrl: '',
        fileSize: 0
      }
    };
  },
  onLoad(options) {
    if (options.id) {
      this.id = options.id;
      this.getDocumentDetail();
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
  // 分享小程序页面的钩子函数
  onShareAppMessage() {
    return {
      title: this.documentData.title || '文书模板',
      path: `/pages/user/template/document-detail?id=${this.id}`,
      desc: this.documentData.summary || '点击查看详情'
    }
  },
  methods: {
    // 获取文书详情
    async getDocumentDetail() {
      this.loading = true;
      try {
        const res = await getDocumentDetail(this.id);
        if (res) {
          this.documentData = {
            title: res.title || '',
            summary: res.summary || '',
            content: processRichText(res.content || ''),
            fileUrl: res.fileUrl || '',
            fileSize: res.fileSize || 0
          };
        } else {
          uni.showToast({
            title: '获取文书详情失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取文书详情异常:', error);
        uni.showToast({
          title: '获取文书详情失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // Download authorization, counter update, and user-document recording all
    // happen on the server before the returned short-lived URL is used.
    async resolveDownloadUrl() {
      const result = await getDocumentDownloadUrl(this.id);
      const url = typeof result === 'string' ? result : (result && result.url) || '';
      if (!url) {
        throw new Error('服务器未返回可下载地址');
      }
      return url;
    },
    async downloadDocument() {
      uni.showLoading({ title: '文档下载中...' });
      try {
        const downloadUrl = await this.resolveDownloadUrl();
        // #ifdef H5
        if (typeof window !== 'undefined') {
          window.open(downloadUrl, '_blank');
        }
        // #endif
        // #ifndef H5
        await new Promise((resolve, reject) => {
          uni.downloadFile({
            url: downloadUrl,
            success: (res) => {
              if (res.statusCode !== 200) {
                reject(new Error('下载文档失败'));
                return;
              }
              uni.saveFile({
                tempFilePath: res.tempFilePath,
                success: (saveRes) => {
                  uni.openDocument({
                    filePath: saveRes.savedFilePath,
                    showMenu: true,
                    success: resolve,
                    fail: reject
                  });
                },
                fail: reject
              });
            },
            fail: reject
          });
        });
        // #endif
      } catch (error) {
        console.error('下载文书失败:', error);
        uni.showToast({ title: error.message || '文书暂不可下载，请稍后重试', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 跳转到我的文书页面
    navigateToMyDocuments() {
      uni.navigateTo({
        url: '/pages/user/template/my-documents'
      });
    },
    
    // 复制下载链接
    async copyDownloadLink() {
      try {
        const downloadUrl = await this.resolveDownloadUrl();
        uni.setClipboardData({
          data: downloadUrl,
          success: () => uni.showToast({ title: '下载链接已复制', icon: 'none' }),
          fail: () => uni.showToast({ title: '复制链接失败', icon: 'none' })
        });
      } catch (error) {
        uni.showToast({ title: error.message || '文书暂不可下载，请稍后重试', icon: 'none' });
      }
    },
    

  }
}
</script>

<style lang="scss" scoped>
.document-detail-page {
  padding-top: 30rpx;
  min-height: 100vh;
  background-color: #F3F3F3;
  padding-bottom: 130rpx;
}

/* 文书基本信息卡片 */
.basic-info-card {
  margin: 0 30rpx 30rpx 30rpx;
  padding: 0 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.document-header {
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .document-title {
    font-size: 30rpx;
    color: #353D4B;
    font-weight: 500;
  }
}

.divider {
  height: 1rpx;
  background-color: #E8E8E8;
}

.document-intro {
  padding: 30rpx 0;
  
  .intro-text {
    font-size: 24rpx;
    color: #353D4B;
    line-height: 1.6;
  }
}

/* 文书正文部分 */
.content-section {
  margin: 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.content-header {
  height: 96rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  background-size: cover;
  background-position: center;
  
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

.document-content {
  padding: 30rpx;
  color: #2f3a4a;
  font-size: 28rpx;
  line-height: 1.78;
  word-break: break-word;
}

.rich-document-content {
  display: block;
  width: 100%;
}

.rich-document-content :deep(p) {
  margin: 0 0 18rpx;
}

.rich-document-content :deep(h1),
.rich-document-content :deep(h2),
.rich-document-content :deep(h3) {
  margin: 24rpx 0 16rpx;
  color: #1f2d3d;
  font-weight: 700;
}

.rich-document-content :deep(ul),
.rich-document-content :deep(ol) {
  padding-left: 36rpx;
  margin: 16rpx 0;
}

.rich-document-content :deep(table) {
  width: 100%;
  margin: 18rpx 0;
  border-collapse: collapse;
}

.rich-document-content :deep(td),
.rich-document-content :deep(th) {
  padding: 12rpx;
  border: 1rpx solid #dce3ee;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100rpx;
  padding: 0 30rpx;
  background-color: #FFFFFF;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40rpx;
  
  .action-icon {
    width: 40rpx;
    height: 40rpx;
  }
  
  .action-text {
    margin-top: 10rpx;
    font-size: 22rpx;
    color: #353D4B;
  }
}

.download-btn {
  flex: 1;
  height: 76rpx;
  padding: 0 30rpx;
  background-color: #317CFF;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  
  text {
    color: #FFFFFF;
    font-size: 28rpx;
    font-weight: 500;
  }
}

/* 加载状态 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 4rpx solid #FFFFFF;
    border-top-color: #317CFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #FFFFFF;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
