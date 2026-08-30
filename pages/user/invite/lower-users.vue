<!--
 * @Description: 分享用户数据页面
-->
<template>
  <view class="page">
    <!-- 下级用户列表 -->
    <scroll-view 
      scroll-y 
      class="users-list"
      :style="{ height: scrollHeight + 'px' }"
    >
      <base-empty
        v-if="!loading && lowerUsers.length === 0"
        massage="暂无下级用户"
      />
      
      <view 
        class="user-item"
        v-for="(user, index) in lowerUsers"
        :key="index"
      >
        <view class="user-info">
          <image class="user-avatar" src="https://resource.yi-types.com/new-sign/ic_user_head.webp" mode="aspectFit"/>
          <view class="user-content">
            <view class="user-main">
              <text class="nickname">{{ user.nickname }}</text>
              <text class="phone">{{ formatPhone(user.phone) }}</text>
            </view>
            <view class="user-time">
              <text class="time-label">注册时间</text>
              <text class="time-value">{{ formatTime(user.createTime) }}</text>
            </view>
          </view>
        </view>
        
        <!-- 展开下级用户按钮 -->
        <view 
          class="toggle-btn" 
          v-if="user.lowerList && user.lowerList.length > 0"
          @click="toggleLowerUsers(index)"
        >
          <text>{{ expandedIndex === index ? '收起下级' : '查看下级' }}</text>
          <uni-icons 
            :type="expandedIndex === index ? 'top' : 'bottom'" 
            size="14" 
            color="#3277FF"
          />
        </view>
        
        <!-- 二级下级用户列表 -->
        <view 
          class="lower-users" 
          v-if="expandedIndex === index && user.lowerList && user.lowerList.length > 0"
        >
          <view 
            class="lower-user-item"
            v-for="(lowerUser, lowerIndex) in user.lowerList"
            :key="lowerIndex"
          >
            <view class="lower-user-info">
              <image class="user-avatar" src="/static/ic_user_head.svg" mode="aspectFit"/>
              <view class="user-content">
                <view class="user-main">
                  <text class="nickname">{{ lowerUser.nickname }}</text>
                  <text class="phone">{{ formatPhone(lowerUser.phone) }}</text>
                </view>
                <view class="user-time">
                  <text class="time-label">注册时间</text>
                  <text class="time-value">{{ formatTime(lowerUser.createTime) }}</text>
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
// 导入工具方法
import { formatTime, formatPhone, getLowerUsers } from '@/api/invite';
import BaseEmpty from '@/components/BaseEmpty/BaseEmpty.vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';

export default {
  components: {
    BaseEmpty,
    uniIcons
  },
  data() {
    return {
      lowerUsers: [],
      loading: false,
      scrollHeight: 0,
      expandedIndex: -1 // 展开的下级用户索引
    }
  },
  onLoad() {
    // 计算滚动区域高度
    const systemInfo = uni.getSystemInfoSync()
    this.scrollHeight = systemInfo.windowHeight
    
    // 获取数据
    this.fetchLowerUsers()
    
    // 使用模拟数据
    // this.useMockData()
  },
  methods: {
    // 使用模拟数据
    useMockData() {
      this.loading = true
      
      setTimeout(() => {
        this.lowerUsers = [
          {
            nickname: '杨旭升',
            phone: '138****0000',
            createTime: '2023-05-15 14:30:25',
            lowerList: [
              {
                nickname: '张三',
                phone: '138****0000',
                createTime: '2023-06-20 09:15:36'
              },
              {
                nickname: '李四',
                phone: '138****0000',
                createTime: '2023-07-12 16:45:22'
              }
            ]
          },
          {
            nickname: '王小明',
            phone: '138****0000',
            createTime: '2023-08-05 10:20:18',
            lowerList: []
          },
          {
            nickname: '刘大壮',
            phone: '138****0000',
            createTime: '2023-09-10 11:30:45',
            lowerList: [
              {
                nickname: '赵六',
                phone: '138****0000',
                createTime: '2023-10-01 08:25:12'
              }
            ]
          },
          {
            nickname: '陈晓红',
            phone: '138****0000',
            createTime: '2023-11-20 15:40:33',
            lowerList: []
          }
        ]
        this.loading = false
      }, 500)
    },
    
    // 获取下级用户列表
    async fetchLowerUsers() {
      this.loading = true
      
      try {
        uni.showLoading({
          title: '加载中'
        })
        
        const data = await getLowerUsers()
        this.lowerUsers = data || []
      } catch (err) {
        console.error('获取下级用户失败', err)
        uni.showToast({
          title: '获取数据失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        uni.hideLoading()
      }
    },
    
    // 展开/收起下级用户
    toggleLowerUsers(index) {
      if (this.expandedIndex === index) {
        this.expandedIndex = -1
      } else {
        this.expandedIndex = index
      }
    },
    
    // 格式化工具方法
    formatPhone,
    formatTime
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F6FAFF;
  position: relative;
}

.users-list {
  position: relative;
  z-index: 1;
  padding: 30rpx;
  box-sizing: border-box;
  
  .user-item {
    margin-bottom: 30rpx;
    background: #FFFFFF;
    border-radius: 30rpx;
    overflow: hidden;
    box-sizing: border-box;
    
    .user-info {
      padding: 40rpx;
      display: flex;
      align-items: center;
      min-height: 168rpx;
      box-sizing: border-box;
      
      .user-avatar {
        width: 88rpx;
        height: 88rpx;
        margin-right: 30rpx;
      }
      
      .user-content {
        flex: 1;
        
        .user-main {
          display: flex;
          align-items: center;
          margin-bottom: 8rpx;
          
          .nickname {
            font-size: 30rpx;
            color: #353D4B;
            margin-right: 16rpx;
          }
          
          .phone {
            font-size: 26rpx;
            color: #353D4B;
          }
        }
        
        .user-time {
          display: flex;
          align-items: center;
          
          .time-label {
            font-size: 22rpx;
            color: #6E7C93;
            margin-right: 8rpx;
          }
          
          .time-value {
            font-size: 24rpx;
            color: #353D4B;
          }
        }
      }
    }
    
    .toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12rpx 24rpx;
      background: white;
      border-top: 1rpx solid #EBEEF5;
      
      text {
        font-size: 26rpx;
        color: #ff5566;
        margin-right: 8rpx;
      }
    }
    
    .lower-users {
      background: #FFFFFF;
      
      .lower-user-item {
        padding: 40rpx;
        border-top: 1rpx solid #EBEEF5;
        
        .lower-user-info {
          display: flex;
          align-items: center;
          
          .user-avatar {
            width: 88rpx;
            height: 88rpx;
            margin-right: 30rpx;
          }
          
          .user-content {
            flex: 1;
            
            .user-main {
              display: flex;
              align-items: center;
              margin-bottom: 8rpx;
              
              .nickname {
                font-size: 30rpx;
                color: #353D4B;
                margin-right: 16rpx;
              }
              
              .phone {
                font-size: 26rpx;
                color: #353D4B;
              }
            }
            
            .user-time {
              display: flex;
              align-items: center;
              
              .time-label {
                font-size: 22rpx;
                color: #6E7C93;
                margin-right: 8rpx;
              }
              
              .time-value {
                font-size: 24rpx;
                color: #353D4B;
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