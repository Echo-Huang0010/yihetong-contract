<template>
    <view class="page">
      <loading ref="loading" />
      <view class="article-container" v-if="detail">
        <view class="article-header">
          <view class="article-title">{{ detail.title }}</view>
          <view class="article-meta">
            <text class="article-time">{{ detail.publishTime }}</text>
          </view>
        </view>
        
        <!-- 视频内容 -->
        <view class="article-video" v-if="detail.contentType === 'VIDEO' && detail.videoUrl">
          <video 
            :src="detail.videoUrl" 
            controls 
            autoplay="false"
            object-fit="cover"
            class="video-player"
          />
        </view>
        
        <!-- 图片封面 -->
        <view class="article-cover" v-else-if="detail.coverUrl">
          <image :src="detail.coverUrl" mode="widthFix" />
        </view>
        
        <view class="article-summary" v-if="detail.summary">
          {{ detail.summary }}
        </view>
        
        <view class="article-content" v-if="detail.content">
          <rich-text :nodes="processedContent"></rich-text>
        </view>
        
        <!-- 无内容时的提示 -->
        <view class="no-content-tip" v-if="!detail.content && detail.contentType !== 'VIDEO'">
          <text>暂无详细内容</text>
        </view>
      </view>
      
      <view class="empty-container" v-if="!loading && !detail">
        <BaseEmpty massage="未找到文章内容" />
      </view>
    </view>
  </template>
  
  <script>
  import { getNewsDetail } from '@/api/news.js';
  import { mapState } from 'vuex';
  import { processRichText } from '@/utils/richText.js';
  
  export default {
    data() {
      return {
        id: '',
        detail: null,
        loading: true,
        processedContent: ''
      };
    },
    computed: {
      ...mapState(['token'])
    },
    onLoad(options) {
      if (options.id) {
        this.id = options.id;
        this.getDetail();
      } else {
        this.loading = false;
        uni.showToast({
          title: '参数错误',
          icon: 'none'
        });
      }
    },
    methods: {
      async getDetail() {
        this.loading = true;
        try {
          const res = await getNewsDetail(this.id);
          
          // 预期返回格式：{"code":0,"flag":true,"message":"ok","data":{...详情数据...}}
          if (res && res.code === 0 && res.data) {
            this.detail = res.data;
            this.processContent();
            
            // 设置页面标题
            uni.setNavigationBarTitle({
              title: this.detail.title || '内容详情'
            });
          } else if (res && !res.code && res.data) {
            // 另一种可能的格式
            this.detail = res.data;
            this.processContent();
            
            // 设置页面标题
            uni.setNavigationBarTitle({
              title: this.detail.title || '内容详情'
            });
          } else if (res && !res.data) {
            // 直接返回详情对象的情况
            this.detail = res;
            this.processContent();
            
            // 设置页面标题
            uni.setNavigationBarTitle({
              title: this.detail.title || '内容详情'
            });
          } else {
            uni.showToast({
              title: '未获取到内容详情',
              icon: 'none'
            });
          }
        } catch (error) {
          console.error('获取内容详情失败', error);
          uni.showToast({
            title: '获取内容详情失败',
            icon: 'none'
          });
        } finally {
          this.loading = false;
          this.$refs.loading.hide();
        }
      },
      
      // 处理富文本内容
      processContent() {
        if (!this.detail || !this.detail.content) {
          this.processedContent = '';
          return;
        }
        
        this.processedContent = processRichText(this.detail.content);
      }
    },
    onShareAppMessage() {
      if (this.detail) {
        return {
          title: this.detail.title,
          path: `/pages/content/detail?id=${this.id}`
        };
      }
      return {
        title: '内容详情',
        path: '/pages/home/index'
      };
    }
  };
  </script>
  
  <style lang="scss" scoped>
  .page {
    min-height: 100vh;
    background-color: #fff;
    padding-bottom: 40rpx;
  }
  
  .article-container {
    padding: 30rpx;
  }
  
  .article-header {
    margin-bottom: 30rpx;
    
    .article-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      line-height: 1.5;
      margin-bottom: 20rpx;
    }
    
    .article-meta {
      display: flex;
      align-items: center;
      
      .article-time {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
  
  .article-video {
    margin-bottom: 30rpx;
    border-radius: 12rpx;
    overflow: hidden;
    
    .video-player {
      width: 100%;
      height: 420rpx;
    }
  }
  
  .article-cover {
    margin-bottom: 30rpx;
    border-radius: 12rpx;
    overflow: hidden;
    
    image {
      width: 100%;
    }
  }
  
  .article-summary {
    padding: 20rpx;
    background-color: #f8f8f8;
    border-radius: 8rpx;
    margin-bottom: 30rpx;
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
  }
  
  .article-content {
    font-size: 30rpx;
    color: #333;
    line-height: 1.8;
    
    ::v-deep {
      img {
        max-width: 100% !important;
        height: auto !important;
        width: 100% !important;
        margin: 10rpx 0;
        display: block;
      }
      
      p {
        margin-bottom: 20rpx;
        word-break: break-all;
        word-wrap: break-word;
      }
      
      a {
        color: #FF6565;
        text-decoration: none;
      }
      
      video {
        max-width: 100% !important;
        width: 100% !important;
        height: auto !important;
      }
      
      table {
        width: 100% !important;
        max-width: 100% !important;
        border-collapse: collapse;
        margin: 10rpx 0;
      }
      
      td, th {
        border: 1px solid #e0e0e0;
        padding: 8rpx;
        word-break: break-all;
      }
    }
  }
  
  .no-content-tip {
    padding: 40rpx 0;
    text-align: center;
    color: #999;
    font-size: 28rpx;
  }
  
  .empty-container {
    padding-top: 200rpx;
  }
  </style> 