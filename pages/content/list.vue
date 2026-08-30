<template>
  <view class="page">
    <view class="list-container">
      <!-- 甄选内容列表 -->
      <block v-if="type === 'selected'">
        <view class="content-list">
          <view class="content-item" v-for="(item, index) in contentList" :key="index" @click="navigateToDetail(item.id)">
            <image class="content-image" :src="item.coverUrl" mode="aspectFill" />
            <view class="content-info">
              <view class="content-title text-overflow-2">{{ item.title }}</view>
              <view class="content-desc text-overflow-2">{{ item.description }}</view>
              <view class="content-meta">
                <view class="view-count">
                  <image class="view-icon" src="/static/ic_views.svg" mode="aspectFit" />
                  <text>{{ item.viewCount || 0 }}</text>
                </view>
                <text class="publish-time">{{ item.publishTime }}</text>
              </view>
            </view>
          </view>
        </view>
      </block>
      
      <!-- 文书列表 -->
      <block v-if="type === 'document'">
        <view class="document-list">
          <view class="document-item" v-for="(item, index) in contentList" :key="index" @click="navigateToDetail(item.id)">
            <view class="document-info">
              <view class="document-title text-overflow-2">{{ item.title }}</view>
              <view class="document-desc text-overflow-2">{{ item.description }}</view>
              <view class="document-meta">
                <text class="document-type">{{ item.type }}</text>
                <text class="document-size">{{ item.size }}</text>
                <text class="document-date">{{ item.publishTime }}</text>
              </view>
            </view>
            <view class="download-btn" @click.stop="downloadDocument(item.id)">
              <image class="download-icon" src="/static/ic_download.svg" mode="aspectFit" />
            </view>
          </view>
        </view>
      </block>
      
      <!-- 空状态 -->
      <view class="empty-container" v-if="!loading && contentList.length === 0">
        <BaseEmpty :message="emptyMessage" />
      </view>
    </view>
    
    <!-- 加载状态 -->
    <loadMore v-if="loading" />
    <baseline v-if="isLastPage && contentList.length > 0" />
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { getContentList, downloadDocument } from '@/api/news.js';

export default {
  data() {
    return {
      type: '',
      subType: '',
      query: {
        pageNum: 1,
        pageSize: 10,
        contentType: '',
        subType: '',
        publishStatus: 'PUBLISHED'
      },
      contentList: [],
      loading: false,
      isLastPage: false,
      refreshing: false
    };
  },
  computed: {
    ...mapState(['token']),
    emptyMessage() {
      const messages = {
        selected: '暂无内容',
        document: '暂无文书',
        service: '暂无服务'
      };
      return messages[this.type] || '暂无数据';
    }
  },
  onLoad(options) {
    this.type = options.type || '';
    this.subType = options.subType || '';
    this.initPage();
  },
  methods: {
    initPage() {
      // 设置页面标题
      const titles = {
        guide: '操作指南',
        case: '经典案例',
        hot: '热点推送',
        legal: '法律文书'
      };
      uni.setNavigationBarTitle({
        title: titles[this.subType] || '内容列表'
      });
      
      // 重置列表
      this.resetList();
      // 获取内容列表
      this.getContentList();
    },
    resetList() {
      this.query.pageNum = 1;
      this.isLastPage = false;
      this.contentList = [];
    },
    async getContentList() {
      if (this.loading) return;
      
      this.loading = true;
      try {
        const res = await getContentList({
          ...this.query,
          contentType: this.type,
          subType: this.subType
        });
        
        if (res && res.code === 0 && res.data) {
          const list = res.data.rows || [];
          
          if (this.query.pageNum === 1) {
            this.contentList = list;
          } else {
            this.contentList = [...this.contentList, ...list];
          }
          
          this.isLastPage = list.length < this.query.pageSize;
        }
      } catch (error) {
        console.error('获取内容列表失败', error);
        uni.showToast({
          title: '获取内容列表失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        this.refreshing = false;
        uni.stopPullDownRefresh();
      }
    },
    navigateToDetail(id) {
      uni.navigateTo({
        url: `/pages/content/detail?id=${id}&type=${this.type}`
      });
    },
    async downloadDocument(id) {
      try {
        const res = await downloadDocument(id);
        if (res && res.code === 0) {
          // 处理下载逻辑
          uni.showToast({
            title: '开始下载',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('下载文书失败', error);
        uni.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    }
  },
  onPullDownRefresh() {
    this.refreshing = true;
    this.resetList();
    this.getContentList();
  },
  onReachBottom() {
    if (!this.isLastPage && !this.loading) {
      this.query.pageNum++;
      this.getContentList();
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.list-container {
  padding: 20rpx;
}

.content-list {
  .content-item {
    display: flex;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    
    .content-image {
      width: 200rpx;
      height: 150rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }
    
    .content-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .content-title {
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
        margin-bottom: 10rpx;
      }
      
      .content-desc {
        font-size: 24rpx;
        color: #666;
        line-height: 1.5;
        margin-bottom: 10rpx;
      }
      
      .content-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 24rpx;
        color: #999;
        
        .view-count {
          display: flex;
          align-items: center;
          
          .view-icon {
            width: 28rpx;
            height: 28rpx;
            margin-right: 8rpx;
          }
        }
      }
    }
  }
}

.document-list {
  .document-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    
    .document-info {
      flex: 1;
      margin-right: 20rpx;
      
      .document-title {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
      }
      
      .document-desc {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .document-meta {
        display: flex;
        align-items: center;
        font-size: 24rpx;
        color: #999;
        
        .document-type {
          margin-right: 20rpx;
        }
        
        .document-size {
          margin-right: 20rpx;
        }
      }
    }
    
    .download-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .download-icon {
        width: 40rpx;
        height: 40rpx;
      }
    }
  }
}

.empty-container {
  padding: 100rpx 0;
}

.text-overflow-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 