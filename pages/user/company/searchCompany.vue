<!--
 * @Description: 企业搜索页面
 * @Author: Claude
 * @Date: 2024-04-18
-->
<template>
  <view class="page-base">
    <!-- 搜索框 -->
    <view class="search-box">
      <view class="search-input-box">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input 
          type="text" 
          v-model="searchForm.keyword"
          placeholder="请输入企业名称"
          placeholder-class="placeholder"
          @input="handleSearch"
        />
        <uni-icons 
          v-if="searchForm.keyword" 
          type="clear" 
          size="18" 
          color="#999"
          @click="clearSearch"
        ></uni-icons>
      </view>
    </view>
    
    <!-- 企业列表 -->
    <view class="company-list">
      <view 
        v-for="(item, index) in companyList" 
        :key="index"
        class="company-item"
        :class="{ active: selectedCompany && selectedCompany.name === item.name }"
        @click="selectCompany(item)"
      >
        <view class="company-name">{{ item.name }}</view>
        <view class="company-info">
          <view class="info-item">
            <text class="label">统一信用代码：</text>
            <text class="value">{{ item.creditCode }}</text>
          </view>
          <view class="info-item">
            <text class="label">法人：</text>
            <text class="value">{{ item.legalPerson }}</text>
          </view>
        </view>
        <view class="select-icon" v-if="selectedCompany && selectedCompany.name === item.name">
          <uni-icons type="checkmarkempty" size="20" color="#FF6565"></uni-icons>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="companyList.length === 0 && searchForm.keyword" class="empty-state">
        <image src="@/static/ImgEmpty.png" mode="aspectFit" />
        <view class="empty-text">未找到相关企业</view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <uni-icons type="spinner-cycle" size="24" color="#FF6565"></uni-icons>
        <text>搜索中...</text>
      </view>
    </view>
    
    <!-- 提交按钮 -->
    <view class="submit-btn" :class="{ disabled: !selectedCompany }" @click="confirmCompany">
      确认企业
    </view>
  </view>
</template>

<script>
import { queryCompanyList } from '@/api/company.js'
import { debounce } from '@/utils/tools.js'

export default {
  data() {
    return {
      searchForm: {
        keyword: ''
      },
      companyList: [],
      selectedCompany: null,
      fromCertification: false,
      loading: false
    }
  },
  
  onLoad(options) {
    if (options.from === 'Certification') {
      this.fromCertification = true
    }
  },
  
  methods: {
    // 搜索企业（使用防抖）
    handleSearch: debounce(async function() {
      if (!this.searchForm.keyword.trim()) {
        this.companyList = []
        return
      }
      
      this.loading = true
      try {
        const res = await queryCompanyList(this.searchForm)
        this.companyList = res
      } catch (error) {
        console.error('搜索企业失败:', error)
        uni.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }, 500),
    
    // 清空搜索
    clearSearch() {
      this.searchForm.keyword = ''
      this.companyList = []
      this.selectedCompany = null
    },
    
    // 选择企业
    selectCompany(company) {
      this.selectedCompany = company
    },
    
    // 确认企业并返回
    confirmCompany() {
      if (!this.selectedCompany) {
        uni.showToast({
          title: '请选择企业',
          icon: 'none'
        })
        return
      }
      
      // 存储选中的企业信息
      uni.setStorageSync('selected_company_info', {
        name: this.selectedCompany.name,
        creditCode: this.selectedCompany.creditCode,
        legalPerson: this.selectedCompany.legalPerson
      })
      
      // 返回上一页
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.page-base {
  padding: 32rpx;
  min-height: 100vh;
  background: #F5F5F5;
  box-sizing: border-box;
  
  .search-box {
    width: 686rpx;
    margin: 0 auto 32rpx;
    background: #FFFFFF;
    padding: 20rpx;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
    
    .search-input-box {
      display: flex;
      align-items: center;
      background: #F5F5F5;
      border-radius: 8rpx;
      padding: 0 20rpx;
      
      input {
        flex: 1;
        height: 80rpx;
        font-size: 28rpx;
        margin: 0 20rpx;
      }
      
      .placeholder {
        color: #999;
      }
    }
  }
  
  .company-list {
    width: 686rpx;
    margin: 0 auto;
    padding-bottom: 140rpx; // 为底部按钮留出空间
    
    .company-item {
      position: relative;
      background: #FFFFFF;
      padding: 32rpx;
      margin-bottom: 20rpx;
      border-radius: 12rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;
      
      &.active {
        background: #E6F0FF;
        border: 2rpx solid #FF6565;
      }
      
      .company-name {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 20rpx;
      }
      
      .company-info {
        .info-item {
          display: flex;
          margin-bottom: 12rpx;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .label {
            font-size: 26rpx;
            color: #666;
            width: 200rpx;
          }
          
          .value {
            font-size: 26rpx;
            color: #333;
            flex: 1;
          }
        }
      }
      
      .select-icon {
        position: absolute;
        right: 32rpx;
        top: 50%;
        transform: translateY(-50%);
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100rpx 0;
      
      image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 20rpx;
      }
      
      .empty-text {
        font-size: 28rpx;
        color: #999;
      }
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40rpx 0;
      
      text {
        font-size: 28rpx;
        color: #666;
        margin-left: 12rpx;
      }
    }
  }
  
  .submit-btn {
    position: fixed;
    bottom: 32rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 686rpx;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    background: #FF6565;
    color: #FFFFFF;
    border-radius: 12rpx;
    font-size: 32rpx;
    font-weight: 500;
    box-shadow: 0 4rpx 16rpx rgba(50, 119, 255, 0.3);
    transition: all 0.3s ease;
    opacity: 1;
    
    &.disabled {
      background: #FF6565;
      opacity: 0.5;
      box-shadow: none;
      cursor: not-allowed;
    }
    
    &:active {
      transform: translateX(-50%) scale(0.98);
    }
  }
}
</style>
