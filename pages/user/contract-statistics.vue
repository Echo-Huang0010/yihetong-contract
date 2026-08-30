<!--
 * @Description: 合同交易数据页面
-->
<template>
  <view class="page">
    <!-- 合同交易数据列表 -->
    <scroll-view 
      scroll-y 
      class="contract-list"
      :style="{ height: scrollHeight + 'px' }"
    >
      <base-empty
        v-if="!loading && contractData.length === 0"
        massage="暂无合同交易数据"
      />
      
      <view 
        class="contract-item"
        v-for="(item, index) in contractData"
        :key="index"
      >
        <!-- 顶部区域 -->
        <view class="item-top">
          <image class="top-bg" src="https://resource.yi-types.com/new-sign/img_contract_item_top.webp" mode="aspectFill"/>
          <view class="top-content">
            <view class="left-content">
              <view class="user-indicator"></view>
              <text class="user-phone">{{ formatPhone(item.phone) }}</text>
              <view class="user-level">
                <text>一级</text>
              </view>
              <image class="add-icon" src="/static/ic_statistics_add.svg" mode="aspectFit"/>
            </view>
            <text class="create-time">{{ formatTime(item.createTime) }}</text>
          </view>
        </view>
        
        <!-- 底部区域 -->
        <view class="item-bottom">
          <view class="stats-container">
            <view class="stats-item">
              <text class="stats-value">{{ item.contractCount }}</text>
              <text class="stats-label">合同数量</text>
            </view>
            <view class="divider"></view>
            <view class="stats-item">
              <text class="stats-value">{{ item.contractAmount }}</text>
              <text class="stats-label">合同金额</text>
            </view>
            <view class="divider"></view>
            <view class="stats-item">
              <text class="stats-value">{{ item.rewardAmount }}</text>
              <text class="stats-label">奖励金额</text>
            </view>
          </view>
          
          <!-- 二级用户列表 -->
          <view 
            class="sub-user-list"
            v-if="item.subUsers && item.subUsers.length > 0"
          >
            <view 
              class="sub-user-item"
              v-for="(subUser, subIndex) in item.subUsers"
              :key="subIndex"
            >
              <!-- 二级用户顶部 -->
              <view class="sub-item-top">
                <view class="left-content">
                  <text class="user-phone">{{ formatPhone(subUser.phone) }}</text>
                  <view class="user-level">
                    <text>二级</text>
                  </view>
                </view>
                <text class="create-time">{{ formatTime(subUser.createTime) }}</text>
              </view>
              
              <!-- 分割线 -->
              <view class="sub-divider"></view>
              
              <!-- 二级用户底部 -->
              <view class="sub-item-bottom">
                <view class="stats-container">
                  <view class="stats-item">
                    <text class="stats-value">{{ subUser.contractCount }}</text>
                    <text class="stats-label">合同数量</text>
                  </view>
                  <view class="divider sub-divider-vertical"></view>
                  <view class="stats-item">
                    <text class="stats-value">{{ subUser.contractAmount }}</text>
                    <text class="stats-label">合同金额</text>
                  </view>
                  <view class="divider sub-divider-vertical"></view>
                  <view class="stats-item">
                    <text class="stats-value">{{ subUser.rewardAmount }}</text>
                    <text class="stats-label">奖励金额</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载中提示 -->
      <view class="loading" v-if="loading">
        <view class="loading-spinner"/>
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import BaseEmpty from '@/components/BaseEmpty/BaseEmpty.vue';

export default {
  components: {
    BaseEmpty
  },
  data() {
    return {
      contractData: [],
      loading: false,
      scrollHeight: 0
    }
  },
  onLoad() {
    // 计算滚动区域高度
    const systemInfo = uni.getSystemInfoSync()
    this.scrollHeight = systemInfo.windowHeight
    
    // 获取数据
    this.useMockData()
  },
  methods: {
    // 使用模拟数据
    useMockData() {
      this.loading = true
      
      setTimeout(() => {
        this.contractData = [
          {
            phone: '138****0000',
            createTime: '2023-05-15 14:30:25',
            contractCount: 12,
            contractAmount: '1,280.00',
            rewardAmount: '128.00',
            subUsers: [
              {
                phone: '138****0000',
                createTime: '2023-06-20 09:15:36',
                contractCount: 5,
                contractAmount: '520.00',
                rewardAmount: '52.00'
              },
              {
                phone: '138****0000',
                createTime: '2023-07-12 16:45:22',
                contractCount: 3,
                contractAmount: '360.00',
                rewardAmount: '36.00'
              }
            ]
          },
          {
            phone: '138****0000',
            createTime: '2023-08-05 10:20:18',
            contractCount: 8,
            contractAmount: '960.00',
            rewardAmount: '96.00',
            subUsers: []
          },
          {
            phone: '138****0000',
            createTime: '2023-09-10 11:30:45',
            contractCount: 15,
            contractAmount: '1,500.00',
            rewardAmount: '150.00',
            subUsers: [
              {
                phone: '138****0000',
                createTime: '2023-10-01 08:25:12',
                contractCount: 6,
                contractAmount: '720.00',
                rewardAmount: '72.00'
              }
            ]
          }
        ]
        this.loading = false
      }, 500)
    },
    
    // 格式化手机号
    formatPhone(phone) {
      if (!phone) return '';
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return '';
      return time;
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F3F3F3;
  position: relative;
}

.contract-list {
  position: relative;
  z-index: 1;
  padding: 30rpx;
  box-sizing: border-box;
  
  .contract-item {
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
          
          .user-indicator {
            width: 6rpx;
            height: 30rpx;
            background: #317CFF;
            border-radius: 120rpx;
          }
          
          .user-phone {
            margin-left: 10rpx;
            font-size: 30rpx;
            color: #353D4B;
          }
          
          .user-level {
            margin-left: 20rpx;
            width: 60rpx;
            height: 40rpx;
            background: #FFEEEE;
            border-radius: 10rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            
            text {
              font-size: 22rpx;
              color: #317CFF;
            }
          }
          
          .add-icon {
            margin-left: 20rpx;
            width: 60rpx;
            height: 40rpx;
          }
        }
        
        .create-time {
          font-size: 22rpx;
          color: #353D4B;
        }
      }
    }
    
    .item-bottom {
      background: #FFFFFF;
      border-radius: 30rpx;
      padding: 30rpx;
      
      .stats-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .stats-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          
          .stats-value {
            font-size: 40rpx;
            color: #317CFF;
            margin-bottom: 8rpx;
          }
          
          .stats-label {
            font-size: 24rpx;
            color: #353D4B;
          }
        }
        
        .divider {
          width: 2rpx;
          height: 56rpx;
          background: #E5E5E5;
        }
      }
      
      .sub-user-list {
        margin-top: 30rpx;
        
        .sub-user-item {
          height: 230rpx;
          background: #F9F9F9;
          border-radius: 30rpx;
          margin-bottom: 20rpx;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .sub-item-top {
            height: 90rpx;
            padding: 0 30rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;
            
            .left-content {
              display: flex;
              align-items: center;
              
              .user-phone {
                font-size: 26rpx;
                color: #353D4B;
              }
              
              .user-level {
                margin-left: 12rpx;
                width: 60rpx;
                height: 40rpx;
                background: #E0E3FF;
                border-radius: 10rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                
                text {
                  font-size: 22rpx;
                  color: #2C5DFF;
                }
              }
            }
            
            .create-time {
              font-size: 22rpx;
              color: #353D4B;
            }
          }
          
          .sub-divider {
            height: 2rpx;
            background: #E8E8E8;
          }
          
          .sub-item-bottom {
            padding: 30rpx;
            
            .stats-container {
              .stats-item {
                .stats-value {
                  font-size: 32rpx;
                }
              }
              
              .sub-divider-vertical {
                height: 40rpx;
              }
            }
          }
        }
      }
    }
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx;
    font-size: 24rpx;
    color: #3277FF;
    
    .loading-spinner {
      width: 32rpx;
      height: 32rpx;
      margin-right: 12rpx;
      border: 3rpx solid rgba(50, 119, 255, 0.2);
      border-top: 3rpx solid #3277FF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}
</style> 