<template>
  <view class="page-base selected-page">
    <!-- 顶部渐变背景 -->
    <view class="top-bg">
      <image class="top-bg-image" src="https://resource.yi-types.com/new-sign/bg_robot_top.webp" mode="aspectFit" />
    </view>
    <!-- #ifdef H5 -->
    <custom-nav title="甄选内容" :showBack="true" transparent class="selected-nav"></custom-nav>
    <!-- #endif -->
    
    <view class="container">
      <view class="content-card">
        <view class="content-list" v-if="newsList.length">
          <view class="content-item" v-for="item in newsList" :key="item.id" @click="viewContent(item)">
            <view class="item-content">
              <view class="item-image">
                <image
                  :class="{ 'item-image-fallback': item.coverUrl === contentCoverFallback }"
                  :src="item.coverUrl || contentCoverFallback"
                  :mode="item.coverUrl === contentCoverFallback ? 'aspectFit' : 'aspectFill'"
                  @error="handleContentCoverError(item)"
                />
              </view>
              <view class="item-info">
                <view class="item-title text-overflow-2">{{ item.title }}</view>
                <view class="item-meta">
                  <view class="view-count" v-if="item.viewCount">
                    <image class="view-icon" src="/static/ic_views.svg" mode="aspectFit" />
                    <text class="view-text">{{ item.viewCount || 0 }}</text>
                  </view>
                  <view class="item-date">{{ item.publishTime }}</view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="nodata" v-else>
          <BaseEmpty description="暂无内容" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getNewsList } from '@/api/news.js';
import customNav from '@/components/custom-nav/custom-nav.vue';
import BaseEmpty from '@/components/BaseEmpty/BaseEmpty.vue';
import { CONTENT_COVER_FALLBACK, normalizeContentRows } from '@/utils/content-assets.js';

export default {
  components: {
    customNav,
    BaseEmpty
  },
  data() {
    return {
      newsList: [], // 甄选内容列表
      pageNum: 1,
      pageSize: 10,
      totalPages: 0,
      loading: false,
      contentCoverFallback: CONTENT_COVER_FALLBACK
    };
  },
  onLoad() {
    this.getNewsList();
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.pageNum = 1;
    this.getNewsList();
  },
  // 上拉加载更多
  onReachBottom() {
    if (this.pageNum < this.totalPages) {
      this.pageNum++;
      this.getNewsList(false);
    }
  },
  methods: {
    handleContentCoverError(item) {
      if (item && item.coverUrl !== CONTENT_COVER_FALLBACK) {
        this.$set(item, 'coverUrl', CONTENT_COVER_FALLBACK);
      }
    },
    // 获取甄选内容列表
    async getNewsList(refresh = true) {
      if (this.loading) return;
      this.loading = true;
      
      try {
        const res = await getNewsList({
          pageNum: this.pageNum,
          pageSize: this.pageSize,
          publishStatus: 'PUBLISHED'
        });
        
        if (res && res.code === 0 && res.data && res.data.rows) {
          if (refresh) {
            this.newsList = normalizeContentRows(res.data.rows);
          } else {
            this.newsList = [...this.newsList, ...normalizeContentRows(res.data.rows)];
          }
          this.totalPages = Math.ceil(res.data.total / this.pageSize);
        } else if (res && res.data && res.data.rows === undefined) {
          if (refresh) {
            this.newsList = normalizeContentRows(res.data);
          } else {
            this.newsList = [...this.newsList, ...normalizeContentRows(res.data)];
          }
          this.totalPages = Math.ceil(res.total / this.pageSize);
        } else if (res && res.rows) {
          if (refresh) {
            this.newsList = normalizeContentRows(res.rows);
          } else {
            this.newsList = [...this.newsList, ...normalizeContentRows(res.rows)];
          }
          this.totalPages = Math.ceil(res.total / this.pageSize);
        } else {
          if (refresh) {
            this.newsList = [];
          }
        }
      } catch (error) {
        console.error('获取甄选内容列表失败', error);
        if (refresh) {
          this.newsList = [];
        }
      } finally {
        this.loading = false;
        uni.stopPullDownRefresh();
      }
    },
    // 查看内容详情
    viewContent(item) {
      uni.navigateTo({
        url: `/pages/content/detail?id=${item.id}`
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.page-base {
  min-height: 100vh;
  background-color: #E4EEFF;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  position: relative;
}

.top-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 816rpx;
  z-index: 0;
}

.top-bg-image {
  width: 100%;
  height: 100%;
}

:deep(.selected-nav) {
  background: transparent;
  background-color: transparent !important;
  
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
  padding-top: 32rpx;
  padding-bottom: 30rpx;
  position: relative;
  z-index: 1;
}

.content-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  width: 100%;
  box-sizing: border-box;
  
  .content-list {
    .content-item {
      padding: 20rpx 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-content {
        display: flex;
        
        .item-image {
          width: 156rpx;
          height: 156rpx;
          border-radius: 8rpx;
          overflow: hidden;
          
          image {
            width: 100%;
            height: 100%;
          }

          .item-image-fallback {
            width: 64rpx;
            height: 64rpx;
            padding: 46rpx;
            background: #eef4ff;
          }
        }
        
        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-left: 30rpx;
          
          .item-title {
            font-size: 28rpx;
            font-weight: bold;
            color: #333;
            line-height: 1.5;
          }
          
          .item-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10rpx;
            
            .view-count {
              display: flex;
              align-items: center;
              
              .view-icon {
                width: 28rpx;
                height: 28rpx;
              }
              
              .view-text {
                font-size: 24rpx;
                color: #6E7C93;
                margin-left: 14rpx;
              }
            }
            
            .item-date {
              font-size: 24rpx;
              color: #6E7C93;
            }
          }
        }
      }
    }
  }
  
  .nodata {
    padding: 40rpx 0;
    text-align: center;
  }
}

.text-overflow-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
