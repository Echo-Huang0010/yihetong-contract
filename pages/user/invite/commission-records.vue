<!--
 * @Description: 合同交易数据页面
-->
<template>
  <view class="page">
    <!-- 交易数据列表 -->
    <scroll-view 
      scroll-y 
      class="transaction-list"
      @scrolltolower="loadMore"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view 
        class="list-item"
        v-for="(item, index) in commissionList"
        :key="index"
      >
        <!-- 顶部区域 -->
        <view class="item-top">
          <image class="top-bg" src="https://resource.yi-types.com/new-sign/img_contract_item_top.webp" mode="aspectFill"/>
          <view class="top-content">
            <view class="left-content">
              <view class="user-indicator"></view>
              <text class="user-phone">{{ formatPhone(item.buyerPhone) }}</text>
              <view class="user-level">
                <text>一级</text>
              </view>
              <image class="add-icon" src="https://resource.yi-types.com/new-sign/ic_statistics_add.webp" mode="aspectFit" @click="showDispatchModal(item.buyerId)"/>
            </view>
            <text class="create-time">{{ item.orderCreateTime ? formatTime(item.orderCreateTime) : '' }}</text>
          </view>
        </view>
        
        <!-- 底部区域 -->
        <view class="item-bottom">
          <view class="stats-container">
            <view class="stats-item">
              <text class="stats-value">{{ item.contractNum || 0 }}</text>
              <text class="stats-label">合同数量</text>
            </view>
            <view class="divider"></view>
            <view class="stats-item">
              <text class="stats-value">{{ formatAmount(item.orderAmount || 0) }}</text>
              <text class="stats-label">合同金额</text>
            </view>
            <view class="divider"></view>
            <view class="stats-item">
              <text class="stats-value">{{ formatAmount(item.commission || 0) }}</text>
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
                  <text class="user-phone">{{ formatPhone(subUser.buyerPhone) }}</text>
                  <view class="user-level">
                    <text>二级</text>
                  </view>
                </view>
                <text class="create-time">{{ subUser.orderCreateTime ? formatTime(subUser.orderCreateTime) : '' }}</text>
              </view>
              
              <!-- 分割线 -->
              <view class="sub-divider"></view>
              
              <!-- 二级用户底部 -->
              <view class="sub-item-bottom">
                <view class="stats-container">
                  <view class="stats-item">
                    <text class="stats-value">{{ subUser.contractNum || 0 }}</text>
                    <text class="stats-label">合同数量</text>
                  </view>
                  <view class="divider sub-divider-vertical"></view>
                  <view class="stats-item">
                    <text class="stats-value">{{ formatAmount(subUser.orderAmount || 0) }}</text>
                    <text class="stats-label">合同金额</text>
                  </view>
                  <view class="divider sub-divider-vertical"></view>
                  <view class="stats-item">
                    <text class="stats-value">{{ formatAmount(subUser.commission || 0) }}</text>
                    <text class="stats-label">奖励金额</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空数据提示 -->
      <base-empty
        v-if="commissionList.length === 0 && !loading"
        massage="暂无交易数据"
      />

      <!-- 加载更多 -->
      <view class="loading" v-if="loading">
        <view class="loading-spinner"/>
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="noMore && commissionList.length > 0">
        <text>没有更多数据了</text>
      </view>
    </scroll-view>
    
    <!-- 分配合同弹窗 -->
    <uni-popup ref="dispatchPopup" type="center">
      <view class="dispatch-modal">
        <view class="modal-title">向下级分配合同</view>
        <view class="modal-content">
          <!-- 身份选择 -->
          <view class="identity-selector" v-if="userIdentities.length > 0">
            <view class="selector-title">选择接收方身份</view>
            <view class="identity-options">
              <view 
                v-for="(item, index) in userIdentities" 
                :key="index" 
                :class="['identity-option', selectedIdentity && selectedIdentity.id === item.id ? 'active' : '']"
                @click="selectIdentity(item)"
              >
                <view class="option-type">{{ item.type === 0 ? '个人' : '企业' }}</view>
                <view class="option-name">{{ item.name }}</view>
              </view>
            </view>
          </view>
          
          <view class="loading-identities" v-if="loadingIdentities">
            <view class="loading-spinner"></view>
            <text>加载身份信息...</text>
          </view>
          
          <!-- 输入分配数量 -->
          <input 
            type="number" 
            v-model="dispatchNum" 
            placeholder="请输入分配的合同数量"
            class="dispatch-input"
          />
        </view>
        <view class="modal-footer">
          <view class="btn cancel" @click="closeDispatchModal">取消</view>
          <view class="btn confirm" @click="confirmDispatch">确认</view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
// 导入API接口
import { 
  getCommissionList, 
  formatAmount,
  formatPhone,
  formatTime,
  dispatchContract
} from '@/api/invite';
import distributor from '@/api/distributor';
import BaseEmpty from '@/components/BaseEmpty/BaseEmpty.vue';
import { mapState } from 'vuex';

export default {
  components: {
    BaseEmpty
  },
  computed: {
    ...mapState(['userInfo'])
  },
  data() {
    return {
      commissionList: [],
      pageNo: 1,
      pageSize: 10,
      loading: false,
      noMore: false,
      scrollHeight: 0,
      dispatchNum: '', // 分配的合同数量
      currentUserId: null, // 当前选中的用户ID
      userIdentities: [], // 用户身份列表
      selectedIdentity: null, // 选中的身份
      loadingIdentities: false // 是否正在加载身份列表
    }
  },
  onLoad() {
    // 计算滚动区域高度
    const systemInfo = uni.getSystemInfoSync()
    this.scrollHeight = systemInfo.windowHeight
    
    // 获取数据
    this.fetchCommissionList(true)
  },
  methods: {
    // 获取佣金列表
    async fetchCommissionList(reset = false) {
      if (this.loading) return
      
      if (reset) {
        this.pageNo = 1
        this.commissionList = []
        this.noMore = false
      }
      
      this.loading = true
      
      try {
        const params = {
          pageNo: this.pageNo,
          pageSize: this.pageSize
        }
        
        uni.showLoading({
          title: '加载中'
        })
        
        const data = await getCommissionList(params)
        const { rows = [], total = 0 } = data
        
        // 处理数据，适配实际返回的数据结构
        const processedData = rows.map(item => {
          return {
            ...item,
            // 使用buyerId作为ID
            buyerId: item.buyerId,
            // 使用phone作为手机号
            buyerPhone: item.phone,
            // 默认设为一级用户
            level: item.level || 1,
            // 处理子用户列表
            subUsers: item.lowerList && item.lowerList.length > 0 ? item.lowerList.map(subItem => ({
              ...subItem,
              buyerId: subItem.buyerId,
              buyerPhone: subItem.phone,
              level: subItem.level || 2
            })) : []
          }
        })
        
        if (reset) {
          this.commissionList = processedData
        } else {
          this.commissionList = [...this.commissionList, ...processedData]
        }
        
        // 判断是否还有更多数据
        this.noMore = this.commissionList.length >= total
      } catch (err) {
        // 错误处理已在request中统一处理
        console.error('获取佣金列表失败', err)
      } finally {
        this.loading = false
        uni.hideLoading()
      }
    },
    
    // 加载更多数据
    loadMore() {
      if (this.loading || this.noMore) return
      
      this.pageNo++
      this.fetchCommissionList()
    },
    
    // 显示分配合同弹窗
    async showDispatchModal(userId) {
      this.currentUserId = userId
      this.dispatchNum = ''
      this.selectedIdentity = null
      this.userIdentities = []
      this.loadingIdentities = true
      
      // 获取用户身份列表
      await this.fetchUserIdentities(userId)
      
      this.$refs.dispatchPopup.open()
    },
    
    // 获取用户身份列表
    async fetchUserIdentities(userId) {
      this.loadingIdentities = true
      
      try {
        uni.showLoading({
          title: '加载中'
        })
        
        const data = await distributor.getDistributorUserInfo(userId)
        
        if (Array.isArray(data) && data.length > 0) {
          this.userIdentities = data
          // 默认选中第一个身份
          this.selectedIdentity = data[0]
        } else {
          this.userIdentities = []
          uni.showToast({
            title: '未找到用户身份信息',
            icon: 'none'
          })
        }
      } catch (err) {
        console.error('获取用户身份列表失败', err)
        uni.showToast({
          title: '获取用户身份失败',
          icon: 'none'
        })
      } finally {
        this.loadingIdentities = false
        uni.hideLoading()
      }
    },
    
    // 选择身份
    selectIdentity(identity) {
      this.selectedIdentity = identity
    },
    
    // 关闭分配合同弹窗
    closeDispatchModal() {
      this.$refs.dispatchPopup.close()
      this.dispatchNum = ''
      this.currentUserId = null
      this.selectedIdentity = null
      this.userIdentities = []
    },
    
    // 确认分配合同
    async confirmDispatch() {
      if (!this.selectedIdentity) {
        uni.showToast({
          title: '请选择接收方身份',
          icon: 'none'
        })
        return
      }
      
      if (!this.dispatchNum) {
        uni.showToast({
          title: '请输入分配数量',
          icon: 'none'
        })
        return
      }
      
      const num = parseInt(this.dispatchNum)
      
      if (isNaN(num) || num <= 0) {
        uni.showToast({
          title: '请输入正确的数量',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({
        title: '提交中'
      })
      
      try {
        // 构建参数
        const params = {
          sourceUserId: this.userInfo.userId, // 当前用户ID
          targetUserId: this.currentUserId, // 目标用户ID
          targetContractType: this.selectedIdentity.type === 0 ? 'p' : 'c', // p:个人 c:企业
          contractNum: num
        }
        
        // 如果是企业身份，添加企业ID
        if (this.selectedIdentity.type === 1) {
          params.targetCompanyId = this.selectedIdentity.id
        }
        
        await dispatchContract(params)
        
        uni.showToast({
          title: '分配成功',
          icon: 'success'
        })
        
        this.closeDispatchModal()
        
        // 刷新页面数据
        this.fetchCommissionList(true)
      } catch (err) {
        console.error('分配合同失败', err)
        // 错误处理已在request中统一处理
      } finally {
        uni.hideLoading()
      }
    },
    
    // 格式化工具方法
    formatAmount,
    formatPhone,
    formatTime
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F3F3F3;
  position: relative;
}

.transaction-list {
  position: relative;
  z-index: 1;
  padding: 30rpx;
  box-sizing: border-box;
  
  .list-item {
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
            background: #E4F2FF;
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
  
  .loading, .no-more {
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

.dispatch-modal {
  background: #ffffff;
  border-radius: 24rpx;
  width: 600rpx;
  padding: 32rpx;
  
  .modal-title {
    font-size: 32rpx;
    text-align: center;
    margin-bottom: 32rpx;
    color: #333333;
  }
  
  .modal-content {
    padding: 30rpx;
    
    .identity-selector {
      margin-bottom: 24rpx;
      
      .selector-title {
        font-size: 28rpx;
        color: #353D4B;
        margin-bottom: 16rpx;
      }
      
      .identity-options {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        
        .identity-option {
          width: 47%;
          padding: 15rpx 20rpx;
          background: #F9F9F9;
          border-radius: 10rpx;
          margin-bottom: 16rpx;
          border: 1px solid transparent;
          
          &.active {
            background: #FFF4F4;
            border-color: #317CFF;
          }
          
          .option-type {
            font-size: 24rpx;
            color: #999999;
            margin-bottom: 6rpx;
          }
          
          .option-name {
            font-size: 26rpx;
            color: #353D4B;
            font-weight: 500;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }
        }
      }
    }
    
    .loading-identities {
      padding: 30rpx 0;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .loading-spinner {
        width: 40rpx;
        height: 40rpx;
        border: 4rpx solid #f0f0f0;
        border-top: 4rpx solid #317CFF;
        border-radius: 50%;
        margin-right: 10rpx;
        animation: spin 1s linear infinite;
      }
      
      text {
        font-size: 24rpx;
        color: #999999;
      }
    }
    
    .dispatch-input {
      height: 80rpx;
      background: #F9F9F9;
      border-radius: 10rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      color: #353D4B;
    }
  }
  
  .modal-footer {
    margin-top: 32rpx;
    display: flex;
    justify-content: space-between;
    gap: 24rpx;
    
    .btn {
      flex: 1;
      height: 88rpx;
      border-radius: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      
      &.cancel {
        background: #f5f5f5;
        color: #666666;
      }
      
      &.confirm {
        background: #317CFF;
        color: #ffffff;
        letter-spacing: 2rpx;
      }
    }
  }
}
</style> 