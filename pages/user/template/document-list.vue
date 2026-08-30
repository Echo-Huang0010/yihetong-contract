<template>
  <view class="template-list-page">
    <!-- Tab栏 -->
    <scroll-view class="tab-scroll-view" scroll-x="true" :show-scrollbar="false" scroll-with-animation>
      <view class="tab-container">
        <view 
          v-for="(item, index) in tabList" 
          :key="index" 
          class="tab-item" 
          :class="{ 'active': currentTab === index }"
          @click="switchTab(index)"
        >
          <text class="tab-text">{{ item.name }}</text>
          <view class="tab-indicator" v-if="currentTab === index"></view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 列表区域 -->
    <scroll-view class="content-scroll-view" scroll-y="true">
      <view class="template-list">
        <view 
          class="template-category" 
          v-for="(category, categoryIndex) in visibleCategoryList"
          :key="categoryIndex"
        >
          <view class="category-header">
            <view class="header-indicator"></view>
            <text class="category-title">{{ category.groupName }}</text>
          </view>
          
          <view class="divider"></view>
          
          <view class="template-items">
            <view 
              class="template-item" 
              v-for="(template, templateIndex) in category.documents" 
              :key="templateIndex"
              @click="onTemplateClick(template)"
            >
              <text class="template-name">{{ template.title }}</text>
              <image class="arrow-icon" src="/static/ic_arrow.svg" mode="aspectFit" />
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-container" v-if="loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-container" v-if="!loading && !hasDocuments">
        <text class="empty-text">暂无文书模板</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { getDocumentCategoryTree, getDocumentGroups } from '@/api/content.js';

export default {
  data() {
    return {
      currentTab: 0,
      tabList: [],
      categoryList: [],
      loading: false
    }
  },
  computed: {
    visibleCategoryList() {
      return (this.categoryList || []).filter(
        category => category && category.documents && category.documents.length
      );
    },
    hasDocuments() {
      return this.visibleCategoryList.length > 0;
    }
  },
  methods: {
    // 获取文书分类Tab数据
    async getDocumentCategories() {
      this.loading = true;
      try {
        const res = await getDocumentCategoryTree();
        if (res) {
          this.tabList = res;
          if (this.tabList.length > 0) {
            // 获取第一个分类的文书列表
            this.getCategoryList(this.tabList[0].id);
          } else {
            this.loading = false;
          }
        } else {
          uni.showToast({
            title: '获取文书分类失败',
            icon: 'none'
          });
          this.loading = false;
        }
      } catch (error) {
        console.error('获取文书分类异常:', error);
        uni.showToast({
          title: '获取文书分类失败',
          icon: 'none'
        });
        this.loading = false;
      }
    },
    
    // 切换Tab
    switchTab(index) {
      if (this.currentTab !== index) {
        this.currentTab = index;
        this.getCategoryList(this.tabList[index].id);
      }
    },
    
    // 获取分类列表
    async getCategoryList(topCategoryId) {
      this.loading = true;
      this.categoryList = [];
      
      try {
        const res = await getDocumentGroups(topCategoryId);
        if (res) {
          this.categoryList = res;
        } else {
          uni.showToast({
            title: '获取文书列表失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取文书列表异常:', error);
        uni.showToast({
          title: '获取文书列表失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 点击模板
    onTemplateClick(template) {
      uni.navigateTo({
        url: `/pages/user/template/document-detail?id=${template.id}`
      });
    }
  },
  onLoad() {
    // 获取文书分类数据
    this.getDocumentCategories();
  }
}
</script>

<style lang="scss" scoped>
.template-list-page {
  min-height: 100vh;
  background-color: #F3F3F3;
  display: flex;
  flex-direction: column;
}

/* Tab栏样式 */
.tab-scroll-view {
  height: 88rpx;
  background-color: #FFFFFF;
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
}

.tab-container {
  display: flex;
  height: 88rpx;
  white-space: nowrap;
  padding-left: 30rpx;
}

.tab-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 88rpx;
  padding: 0 20rpx;
  margin-right: 30rpx;
  
  .tab-text {
    font-size: 26rpx;
    color: #6E7C93;
    transition: color 0.3s;
  }
  
  .tab-indicator {
    position: absolute;
    bottom: 0;
    width: 60rpx;
    height: 8rpx;
    background-color: #317CFF;
    border-radius: 120rpx;
    transition: all 0.3s;
  }
  
  &.active {
    .tab-text {
      color: #353D4B;
      font-weight: 500;
    }
  }
}

/* 列表区域样式 */
.content-scroll-view {
  flex: 1;
}

.template-list {
  padding: 30rpx;
}

.template-category {
  margin-bottom: 30rpx;
  padding: 0 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.category-header {
  display: flex;
  align-items: center;
  height: 96rpx;
  
  .header-indicator {
    width: 6rpx;
    height: 30rpx;
    background-color: #317CFF;
    border-radius: 3rpx;
    margin-right: 8rpx;
  }
  
  .category-title {
    font-size: 30rpx;
    color: #353D4B;
    font-weight: 500;
  }
}

.divider {
  height: 1rpx;
  background-color: #E8E8E8;
  margin-bottom: 10rpx;
}

.template-items {
  margin-top: 10rpx;
}

.template-item {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .template-name {
    font-size: 26rpx;
    color: #353D4B;
  }
  
  .arrow-icon {
    width: 30rpx;
    height: 30rpx;
  }
}

/* 加载状态和空状态 */
.loading-container {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid rgba(255, 101, 101, 0.2);
    border-top: 4rpx solid #317CFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #353D4B;
  }
}

.empty-container {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

/* #ifdef H5 */
.template-list {
  padding-top: 22rpx;
}

.empty-container {
  padding: 36rpx 0 24rpx;
}
/* #endif */

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
