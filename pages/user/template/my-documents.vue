<template>
  <view class="my-documents-page">
    
    <view class="document-list">
      <!-- 文档列表项 -->
      <view 
        class="document-item" 
        v-for="(item, index) in documentList" 
        :key="index"
      >
        <view class="document-header" :style="{ backgroundImage: 'url(https://resource.yi-types.com/new-sign/img_contract_item_top.webp)' }">
          <view class="header-left">
            <view class="header-indicator"></view>
            <text class="document-title">{{ item.title }}</text>
          </view>
          <text class="document-time">{{ formatDate(item.createTime) }}</text>
        </view>
        <view class="document-summary" @click="navigateToDetail(item.id)">
          <text>{{ item.summary || '暂无简介' }}</text>
        </view>
        <view class="divider"></view>
        <view class="document-actions">
          <view class="action-btns">
            <view class="action-btn edit-btn" @click="navigateToDetail(item.id)">
              <text>编辑</text>
            </view>
            <view class="action-btn start-btn" @click="startSign(item)">
              <text>发起</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="documentList.length === 0 && !loading">
        <image src="/static/ImgEmpty.png" mode="aspectFit" class="empty-icon" />
        <text class="empty-text">{{ token ? '暂无合同文书' : '登录后查看合同文书' }}</text>
        <view class="login-btn" v-if="!token" @click="goLogin">立即登录</view>
      </view>
      
      <!-- 加载更多 -->
      <uni-load-more :status="loadMoreStatus" v-if="documentList.length > 0"></uni-load-more>
    </view>
  </view>
</template>

<script>
import { getUserDocumentList } from '@/api/content.js';
import customNav from '@/components/custom-nav/custom-nav.vue';
import { mapState } from 'vuex';

export default {
  components: {
    customNav
  },
  data() {
    return {
      loading: false,
      pageNo: 1,
      pageSize: 10,
      documentList: [],
      loadMoreStatus: 'more' // more-加载前的状态，loading-加载中的状态，noMore-没有更多的状态
    };
  },
  computed: {
    ...mapState(['token']),
  },
  onLoad() {
    this.getDocumentList();
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.pageNo = 1;
    this.documentList = [];
    this.getDocumentList().then(() => {
      uni.stopPullDownRefresh();
    });
  },
  // 上拉加载更多
  onReachBottom() {
    if (this.documentList.length < this.total) {
      this.loadMore();
    }
  },
  methods: {
    // 获取文书列表
    async getDocumentList() {
      if (this.loading) return;
      if (!this.token) {
        this.documentList = [];
        this.loadMoreStatus = 'noMore';
        this.loading = false;
        return;
      }
      
      this.loading = true;
      this.loadMoreStatus = 'loading';
      
      try {
        const params = {
          pageNo: this.pageNo,
          pageSize: this.pageSize
        };
        
        const res = await getUserDocumentList(params);
        
        if (res) {
          if (this.pageNo === 1) {
            this.documentList = res.rows || [];
          } else {
            this.documentList = [...this.documentList, ...(res.rows || [])];
          }
          
          
          // 更新加载更多状态
          if (res.rows.length < 1) {
            this.loadMoreStatus = 'noMore';
          } else {
            this.loadMoreStatus = 'more';
          }
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
    
    // 加载更多
    loadMore() {
      if (this.loadMoreStatus === 'loading') return;
      
      this.pageNo++;
      this.getDocumentList();
    },
    
    // 跳转到文书详情
    navigateToDetail(id) {
      uni.navigateTo({
        url: `/pages/user/template/my-document-detail?id=${id}`
      });
    },
    
    // 发起签署
    startSign(item) {
      if (!this.token) {
        this.goLogin();
        return;
      }
        const fileInfo = {
          id: item.id,
          name: item.title,
          url: item.fileUrl,
          size: 0,
          from: 'myDocument'
        };
        
        // 使用全局数据存储文件信息
        getApp().globalData = getApp().globalData || {};
        getApp().globalData.tempFileInfo = fileInfo;
        
        // 跳转到发起签署页面
        uni.navigateTo({
          url: '/pages/contract/sign/index?fromMyDocument=true'
        });
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },

    goLogin() {
      this.common.toLogin();
    }
  }
};
</script>

<style lang="scss" scoped>
.my-documents-page {
  min-height: 100vh;
  background-color: #F3F3F3;
  padding-bottom: 30rpx;
}

.document-list {
  padding: 30rpx;
}

.document-item {
  background-color: #FFFFFF;
  border-radius: 30rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.document-header {
  height: 96rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .header-indicator {
    width: 6rpx;
    height: 30rpx;
    background-color: #317CFF;
    border-radius: 3rpx;
    margin-right: 8rpx;
  }
  
  .document-title {
    font-size: 30rpx;
    color: #353D4B;
    font-weight: 500;
  }
  
  .document-time {
    font-size: 24rpx;
    color: #6E7C93;
  }
}

.document-summary {
  padding: 30rpx;
  
  text {
    font-size: 24rpx;
    color: #353D4B;
    line-height: 1.6;
  }
}

.divider {
  height: 1rpx;
  background-color: #E7E7E7;
  margin: 0 30rpx;
}

.document-actions {
  padding: 20rpx 30rpx;
  
  .action-btns {
    display: flex;
    justify-content: flex-end;
    
    .action-btn {
      width: 130rpx;
      height: 64rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 20rpx;
      
      text {
        font-size: 26rpx;
      }
      
      &.edit-btn {
        border: 1rpx solid #D4D4D4;
        background-color: #FFFFFF;
        
        text {
          color: #353D4B;
        }
      }
      
      &.start-btn {
        background-color: #317CFF;
        
        text {
          color: #FFFFFF;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }

  .login-btn {
    margin-top: 36rpx;
    width: 280rpx;
    height: 76rpx;
    border-radius: 8rpx;
    background: #317CFF;
    color: #FFFFFF;
    font-size: 28rpx;
    line-height: 76rpx;
    text-align: center;
  }
}
</style>
