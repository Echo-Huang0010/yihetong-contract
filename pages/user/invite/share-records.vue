<template>
  <view class="page">
    <view class="content">
      <view class="record-list" v-if="records.length > 0">
        <view class="record-item" v-for="(item, index) in records" :key="index">
          <view class="item-top">
            <image class="top-bg" src="https://resource.yi-types.com/new-sign/img_contract_item_top.webp" mode="aspectFill"/>
            <view class="top-content">
              <view class="left-content">
                <view class="share-indicator"></view>
                <text class="share-title">{{ item.title || '份额变更' }}</text>
              </view>
              <text class="share-amount" :class="{ 'income': item.type === 'income' }">
                {{ item.type === 'income' ? '+' : '-' }}{{ item.amount }}
              </text>
            </view>
          </view>
          
          <view class="item-bottom">
            <view class="user-info">
              <text class="user-name">{{ item.userName || '系统' }}</text>
              <text class="user-phone">{{ item.userPhone || '' }}</text>
            </view>
            <text class="record-time">{{ item.time }}</text>
          </view>
        </view>
      </view>
      
      <view class="empty" v-else>
        <image class="empty-icon" src="/static/ImgEmpty.png" mode="aspectFit" />
        <text class="empty-text">暂无份额记录</text>
      </view>
    </view>
  </view>
</template>

<script>
// 导入API接口
import { getDispatchContractRecords } from '@/api/invite';

export default {
  data() {
    return {
      records: [],
      pageNum: 1,
      pageSize: 10,
      hasMore: true,
      total: 0
    }
  },
  onLoad() {
    this.loadData()
  },
  onReachBottom() {
    if (this.hasMore) {
      this.loadMoreData()
    }
  },
  methods: {
    // 获取页面初始数据
    async loadData() {
      uni.showLoading({
        title: '加载中'
      })
      
      try {
        await this.fetchRecords(1)
      } catch (err) {
        console.error('加载数据失败', err)
      } finally {
        uni.hideLoading()
      }
    },
    
    // 加载更多数据
    async loadMoreData() {
      try {
        await this.fetchRecords(this.pageNum + 1)
      } catch (err) {
        console.error('加载更多数据失败', err)
      }
    },
    
    // 获取份额记录
    async fetchRecords(page) {
      try {
        const res = await getDispatchContractRecords({
          pageNum: page,
          pageSize: this.pageSize
        })
        
        if (res && res.rows) {
          // 处理API返回的数据
          const formattedRecords = this.formatRecords(res.rows);
          
          if (page === 1) {
            this.records = formattedRecords;
            this.total = res.total || 0;
          } else {
            this.records = [...this.records, ...formattedRecords];
          }
          
          this.pageNum = page;
          this.hasMore = formattedRecords.length === this.pageSize && this.records.length < this.total;
        } 
        // else {
        //   // 如果API未实现，使用模拟数据
        //   if (page === 1) {
        //     this.records = [
        //       {
        //         title: '合同签署分配',
        //         time: '2023-05-15 14:30',
        //         amount: '5',
        //         type: 'income',
        //         userName: '杨旭升',
        //         userPhone: '130****5841'
        //       },
        //       {
        //         title: '份额兑换',
        //         time: '2023-05-10 09:15',
        //         amount: '10',
        //         type: 'income',
        //         userName: '张三',
        //         userPhone: '139****4321'
        //       },
        //       {
        //         title: '推广奖励',
        //         time: '2023-05-01 16:45',
        //         amount: '15',
        //         type: 'income',
        //         userName: '李四',
        //         userPhone: '135****4321'
        //       }
        //     ]
        //   }
          
        //   this.hasMore = false;
        // }
      } catch (err) {
        console.error('获取份额记录失败', err);
        uni.showToast({
          title: '获取份额记录失败',
          icon: 'none'
        });
      }
    },
    
    // 格式化API返回的数据
    formatRecords(rows) {
      if (!Array.isArray(rows)) {
        return [];
      }
      
      return rows.map(item => {
        return {
          title: '合同份额分配',
          time: item.createTime || '',
          amount: item.contractNum || '0',
          type: 'income', // 分配记录都是收入
          userName: item.userName || '系统',
          userPhone: item.phone || ''
        };
      });
    },
    
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F3F3F3;
}

.content {
  padding: 30rpx;
}

.record-list {
  .record-item {
    margin-bottom: 30rpx;
    border-radius: 30rpx;
    overflow: hidden;
    box-sizing: border-box;
    
    .item-top {
      position: relative;
      height: 104rpx;
      
      .top-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      .top-content {
        position: relative;
        z-index: 1;
        height: 100%;
        padding: 0 30rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .left-content {
          display: flex;
          align-items: center;
          
          .share-indicator {
            width: 6rpx;
            height: 30rpx;
            background: #317CFF;
            border-radius: 120rpx;
          }
          
          .share-title {
            margin-left: 10rpx;
            font-size: 30rpx;
            color: #353D4B;
          }
        }
        
        .share-amount {
          font-size: 40rpx;
          color: #317CFF;
          font-weight: bold;
          
          &.income {
            color: #317CFF;
          }
        }
      }
    }
    
    .item-bottom {
      background: #FFFFFF;
      padding: 30rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .user-info {
        display: flex;
        align-items: center;
        
        .user-name {
          font-size: 30rpx;
          color: #6E7C93;
          margin-right: 16rpx;
        }
        
        .user-phone {
          font-size: 26rpx;
          color: #353D4B;
        }
      }
      
      .record-time {
        font-size: 24rpx;
        color: #353D4B;
      }
    }
  }
}

.empty {
  margin-top: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #999999;
  }
}
</style> 