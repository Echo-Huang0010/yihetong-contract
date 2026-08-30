<!--
 * @Description: 历史提现记录页面
-->
<template>
  <view class="page">
    <!-- 提现记录列表 -->
    <scroll-view 
      scroll-y 
      class="withdraw-list"
      @scrolltolower="loadMore"
      lower-threshold="50"
    >
      <view 
        class="list-item"
        v-for="(item, index) in withdrawList"
        :key="index"
      >
        <view class="item-header">
          <image class="header-bg" src="https://resource.yi-types.com/new-sign/img_contract_item_top.webp" mode="aspectFill" />
          <view class="header-content">
            <view class="amount-section">
              <view class="red-bar"></view>
              <text class="amount-label">提现金额：</text>
              <text class="amount-value">¥{{ formatAmount(item.amount) }}</text>
            </view>
            <view 
              class="status-tag" 
              :class="{
                'status-pending': item.status === 0,
                'status-success': item.status === 1,
                'status-reject': item.status === 2,
                'status-expired': item.status === 3
              }"
            >
              {{ formatWithdrawStatus(item.status) }}
            </view>
          </view>
        </view>
        
        <view class="item-content">
          <view class="time-info">
            <text class="time-label">申请时间：</text>
            <text class="time-value">{{ formatTime(item.createTime) }}</text>
          </view>
          <view class="view-btn" @click="handleViewPayCode(index)">
            查看奖励码
          </view>
        </view>
      </view>

      <!-- 空数据提示 -->
      <BaseEmpty v-if="withdrawList.length === 0 && !loading" massage="暂无提现记录" />

      <!-- 加载更多 -->
      <view class="loading" v-if="loading">
        <view class="loading-spinner"></view>
        <text>加载中...</text>
      </view>
      <view class="load-more" v-if="!noMore && withdrawList.length > 0 && !loading" @click="loadMore">
        <text>点击加载更多</text>
      </view>
      <view class="no-more" v-if="noMore && withdrawList.length > 0">
        <text>没有更多数据了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
// 导入API接口
import { 
  getWithdrawHistory,
  formatAmount,
  formatTime
} from '@/api/invite';
import BaseEmpty from '@/components/BaseEmpty/BaseEmpty';

export default {
  components: { BaseEmpty },
  data() {
    return {
      withdrawList: [],
      pageNo: 1,
      pageSize: 10,
      loading: false,
      noMore: false,
      scrollHeight: 0
    }
  },
  onLoad() {
    // 计算滚动区域高度
    const systemInfo = uni.getSystemInfoSync()
    // 考虑状态栏和导航栏的高度
    const statusBarHeight = systemInfo.statusBarHeight || 0
    const navBarHeight = 44 // 导航栏高度，通常是44px
    this.scrollHeight = systemInfo.windowHeight - statusBarHeight - navBarHeight
    
    // 获取数据
    this.fetchWithdrawHistory(true)
  },
  
  // 监听页面显示
  onShow() {
    console.log('页面显示')
  },
  
  // 监听页面滚动到底部
  onReachBottom() {
    console.log('页面滚动到底部')
    this.loadMore()
  },
  methods: {
    // 获取提现历史记录
    async fetchWithdrawHistory(reset = false) {
      if (this.loading) return
      
      if (reset) {
        this.pageNo = 1
        this.withdrawList = []
        this.noMore = false
      }
      
      this.loading = true
      
      try {
        const params = {
          pageNo: this.pageNo,
          pageSize: this.pageSize
        }
        
        // 使用模拟数据
        const mockData = getWithdrawHistory(params)
        // const mockData = this.getMockData(this.pageNo, this.pageSize)
        
        if (reset) {
          this.withdrawList = mockData.rows
        } else {
          this.withdrawList = [...this.withdrawList, ...mockData.rows]
        }
        
        // 判断是否还有更多数据
        this.noMore = this.pageNo >= 2 // 模拟只有2页数据
      } catch (err) {
        // 错误处理已在request中统一处理
        console.error('获取提现记录失败', err)
      } finally {
        this.loading = false
      }
    },
    
    // 生成模拟数据
    getMockData(pageNo, pageSize) {
      const mockRows = [
        {
          id: '1001',
          amount: 20000, // 200元
          status: 0, // 审核中
          createTime: new Date(2023, 9, 15, 14, 30).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        },
        {
          id: '1002',
          amount: 50000, // 500元
          status: 1, // 已提现
          createTime: new Date(2023, 9, 10, 9, 15).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        },
        {
          id: '1003',
          amount: 10000, // 100元
          status: 2, // 已驳回
          createTime: new Date(2023, 9, 5, 16, 45).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        },
        {
          id: '1004',
          amount: 30000, // 300元
          status: 3, // 已逾期
          createTime: new Date(2023, 8, 28, 11, 20).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        },
        {
          id: '1005',
          amount: 15000, // 150元
          status: 1, // 已提现
          createTime: new Date(2023, 8, 20, 10, 10).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        }
      ]
      
      const secondPageRows = [
        {
          id: '1006',
          amount: 8000, // 80元
          status: 1, // 已提现
          createTime: new Date(2023, 8, 15, 9, 30).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        },
        {
          id: '1007',
          amount: 12000, // 120元
          status: 0, // 审核中
          createTime: new Date(2023, 8, 10, 14, 20).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        },
        {
          id: '1008',
          amount: 25000, // 250元
          status: 1, // 已提现
          createTime: new Date(2023, 7, 28, 16, 40).getTime(),
          url: '/static/legacy/asset-origin-a/images/img_poster.jpg'
        }
      ]
      
      // 根据页码返回不同的数据
      if (pageNo === 1) {
        return {
          rows: mockRows,
          total: mockRows.length + secondPageRows.length
        }
      } else {
        return {
          rows: secondPageRows,
          total: mockRows.length + secondPageRows.length
        }
      }
    },
    
    // 加载更多数据
    loadMore() {
      console.log('触发加载更多', this.loading, this.noMore)
      if (this.loading || this.noMore) return
      
      this.pageNo++
      this.fetchWithdrawHistory(false)
    },
    
    // 处理查看奖励码按钮点击
    handleViewPayCode(index) {
      const item = this.withdrawList[index]
      if (!item) return
      
      const url = item.url
      this.previewImage(url)
    },
    
    // 预览奖励码图片
    previewImage(url) {
      if (!url) {
        uni.showToast({
          title: '奖励码不存在',
          icon: 'none'
        })
        return
      }
      
      uni.previewImage({
        urls: [url],
        current: url
      })
    },
    
    // 格式化提现状态
    formatWithdrawStatus(status) {
      const statusMap = {
        '0': '审核中',
        '1': '已提现',
        '2': '已驳回',
        '3': '已逾期'
      };
      return statusMap[status] || '未知状态';
    },
    
    // 格式化工具方法
    formatAmount,
    formatTime
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F3F3F3;
}

.withdraw-list {
  padding: 30rpx;
  box-sizing: border-box;
  
  .list-item {
    margin-bottom: 30rpx;
    border-radius: 30rpx;
    overflow: hidden;
    
    .item-header {
      position: relative;
      height: 104rpx;
      overflow: hidden;
      
      .header-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
      }
      
      .header-content {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        padding: 0 30rpx;
        
        .amount-section {
          display: flex;
          align-items: center;
          
          .red-bar {
            width: 6rpx;
            height: 30rpx;
            background: #317CFF;
            border-radius: 120rpx;
            margin-right: 10rpx;
          }
          
          .amount-label {
            font-size: 30rpx;
            color: #353D4B;
            font-weight: normal;
          }
          
          .amount-value {
            font-size: 40rpx;
            color: #317CFF;
            font-weight: bold;
          }
        }
        
        .status-tag {
          width: 114rpx;
          height: 50rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10rpx 20rpx 10rpx 20rpx;
          font-size: 28rpx;
          
          &.status-pending {
            background: #E7F1FF;
            color: #007BFF;
          }
          
          &.status-success {
            background: #E4FFF5;
            color: #00C8BE;
          }
          
          &.status-reject {
            background: #FFEDEA;
            color: #317CFF;
          }
          
          &.status-expired {
            background: #F9F9F9;
            color: #8A8A8A;
          }
        }
      }
    }
    
    .item-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      background: #FFFFFF;
      border-radius: 0 0 30rpx 30rpx;
      
      .time-info {
        display: flex;
        flex-direction: column;
        
        .time-label {
          font-size: 26rpx;
          color: #6E7C93;
          margin-bottom: 4rpx;
        }
        
        .time-value {
          font-size: 26rpx;
          color: #353D4B;
        }
      }
      
      .view-btn {
        width: 200rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #FFFFFF;
        border: 2rpx solid #317CFF;
        border-radius: 20rpx;
        font-size: 26rpx;
        color: #317CFF;
      }
    }
  }
  

  
  .loading, .no-more, .load-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx;
    font-size: 24rpx;
    color: #6E7C93;
    
    .loading-spinner {
      width: 32rpx;
      height: 32rpx;
      margin-right: 12rpx;
      border: 3rpx solid rgba(110, 124, 147, 0.2);
      border-top: 3rpx solid #6E7C93;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
  
  .load-more {
    background-color: #FFFFFF;
    border-radius: 10rpx;
    margin: 20rpx 0;
    padding: 20rpx 0;
    
    text {
      color: #317CFF;
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}
</style> 