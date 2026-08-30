<template>
  <view class="page-base">
    <!-- 背景图片 -->
    <view class="top-bg">
      <image class="top-bg-image" src="https://resource.yi-types.com/new-sign/bg_robot_top.webp" mode="aspectFit" />
    </view>
    <custom-nav
      title="服务助手"
      :showBack="false"
      transparent
      backIconColor="#FFFFFF"
    ></custom-nav>
    
    <view class="section-heading">推荐服务</view>
    
    <!-- 助手区域 -->
    <view class="ai-section">
      <image class="ai-bg" src="https://resource.yi-types.com/new-sign/bg_make_contract.webp" />
      <view class="ai-robot">
        <image class="robot-image" src="https://resource.yi-types.com/new-sign/ic_ai_robot.webp" mode="aspectFit" />
      </view>
      <view class="ai-content">
        <image class="content-bg" src="https://resource.yi-types.com/new-sign/bg_ai_tip.webp" />
        <view class="ai-greeting">Hi~ 我是服务助手小弈</view>
        <view class="ai-description">想了解的企业问题，我都为您尽力解答哦~</view>
      </view>
      <view class="tips-container">
        <view class="tip-item">
          <image class="tip-bg" src="https://resource.yi-types.com/new-sign/bg_ai_tips.webp" />
          <view class="tip-text">如何生成符合行业规范的合同？</view>
        </view>
        <view class="tip-item">
          <image class="tip-bg" src="https://resource.yi-types.com/new-sign/bg_ai_tips.webp" />
          <view class="tip-text">企业的业务系统能和电子合同系统对接吗？</view>
        </view>
      </view>
    </view>
    
    <!-- 功能按钮区域 -->
    <view class="function-section">
      <view class="function-grid">
        <view 
          v-for="(item, index) in functionList" 
          :key="index" 
          class="grid-item"
          @click="navigateToFunction(item)"
        >
          <image class="function-icon" :src="item.icon" mode="aspectFit" />
          <view class="function-content">
            <view class="function-title">{{ item.title }}</view>
            <view class="function-desc">{{ item.desc }}</view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部导航栏 -->
    <tabbar />
  </view>
</template>

<script>
import tabbar from '@/components/tabbar/tabbar.vue';
import customNav from '@/components/custom-nav/custom-nav.vue';
import { getServiceTypeList } from '@/api/content.js';
import { mapState } from 'vuex';
import setting from '@/config/setting.js';

export default {
  components: {
    tabbar,
    customNav
  },
  computed: {
    ...mapState(['token', 'brandConfig']),
    activeSetting() {
      return this.brandConfig || this.setting;
    },
    functionList() {
      // 根据token状态过滤基础功能
      const filteredBaseFunctions = this.baseFunctionList.filter(item => {
        if (item.featureKey && this.activeSetting[item.featureKey] === false) {
          return false;
        }
        if (item.requireToken) {
          return this.token && this.token.trim() !== '';
        }
        return true;
      });
      
      // 合并基础功能和动态服务
      return [...filteredBaseFunctions, ...this.dynamicServices];
    }
  },
  data() {
    return {
      setting,
      baseFunctionList: [
        {
          title: '合同审查',
          desc: '智能优化合同条款',
          icon: 'https://resource.yi-types.com/new-sign/ic_contract_ai_audit.webp',
          path: '/pages/contract/audit/index',
          isFixed: true,
          requireToken: true,
          featureKey: 'contractAuditEnabled'
        },
        {
          title: '生成合同',
          desc: '一键生成合规合同',
          icon: 'https://resource.yi-types.com/new-sign/ic_generate_contract.webp',
          path: '/pages/user/file/aiGenerate',
          isFixed: true,
          requireToken: true
        }
        // ,
        // {
        //   title: '企业报告',
        //   desc: '企业尽调综合分析',
        //   icon: 'https://resource.yi-types.com/new-sign/ic_enterprise_report.webp',
        //   path: '/pages/ai/report/index',
        //   isFixed: true,
        //   requireToken: false
        // }
      ],
      dynamicServices: [],
      loading: false
    };
  },
  mounted() {
    this.getServiceTypes();
  },
  methods: {
    // 获取服务类型列表
    async getServiceTypes() {
      this.loading = true;
      try {
        const res = await getServiceTypeList();
        console.log('getServiceTypeList res:', res);
        
        let services = [];
        if (Array.isArray(res)) {
          services = res;
        } else if (res && res.code === 0 && res.data) {
          services = res.data;
        }
        
        // 将接口返回的服务添加到dynamicServices中
        this.dynamicServices = services.map(service => ({
          title: service.title,
          desc: service.desc || service.description || '',
          icon: service.iconUrl || '/static/ic_default_service.webp',
          path: '',
          id: service.id,
          isFixed: false
        }));
        
      } catch (error) {
        console.error('获取服务类型列表异常:', error);
      } finally {
        this.loading = false;
      }
    },
    
    navigateToFunction(item) {
      // 如果是固定的三个功能，使用原有路径
      if (item.isFixed && item.path) {
        uni.navigateTo({
          url: item.path
        });
      } 
      // 如果是接口返回的数据，跳转到服务详情页面
      else if (item.id) {
        uni.navigateTo({
          url: `/pages/content/service-detail?id=${item.id}`
        });
      } 
      else {
        uni.showToast({
          title: '功能开发中...',
          icon: 'none'
        });
      }
    },
    
  }
};
</script>

<style lang="scss" scoped>
.page-base {
  min-height: 100vh;
  background-color: #E4EEFF;
  position: relative;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
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

.section-heading {
  position: relative;
  z-index: 1;
  margin: 40rpx 50rpx 0;
  font-size: 34rpx;
  line-height: 48rpx;
  color: #ffffff;
  font-weight: 700;
}

.ai-section {
  position: relative;
  z-index: 1;
  width: calc(100% - 60rpx);
  height: 360rpx;
  margin-top: 64rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
}

.ai-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ai-robot {
  position: absolute;
  left: 52rpx;
  top: -20rpx;
  width: 150rpx;
  height: 200rpx;
  
  .robot-image {
    width: 100%;
    height: 100%;
  }
}

.ai-content {
  position: absolute;
  left: 240rpx;
  top: 30rpx;
  width: 420rpx;
  height: 150rpx;
  
  .content-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .ai-greeting {
    position: relative;
    z-index: 1;
    margin-left: 18rpx;
    margin-top: 16rpx;
    font-size: 32rpx;
    color: #FFFFFF;
    font-weight: bold;
  }
  
  .ai-description {
    position: relative;
    z-index: 1;
    margin-top: 6rpx;
    margin-left: 30rpx;
    margin-right: 30rpx;
    font-size: 24rpx;
    color: #FFFFFF;
  }
}

.tips-container {
  position: absolute;
  top: 204rpx;
  left: 30rpx;
  right: 30rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  flex-direction: column;
  
  .tip-item {
    position: relative;
    height: 56rpx;
    flex: 1;
    min-width: 280rpx;
    
    .tip-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .tip-text {
      position: relative;
      z-index: 1;
      margin-left: 30rpx;
      margin-right: 30rpx;
      font-size: 22rpx;
      color: #353D4B;
      line-height: 56rpx;
    }
  }
}

.function-section {
  position: relative;
  z-index: 1;
  width: calc(100% - 60rpx);
  margin-top: 30rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
  background-color: #FFFFFF;
  border-radius: 30rpx;
  padding: 20rpx;
}

.function-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.grid-item {
  display: flex;
  align-items: center;
  width: calc(50% - 10rpx);
  height: 104rpx;
  padding-left: 20rpx;
  background-color: #F0F7FF;
  border-radius: 20rpx;
  margin-bottom: 10rpx;
  
  .function-icon {
    width: 56rpx;
    height: 56rpx;
    margin-right: 18rpx;
  }
  
  .function-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rpx;
    
    .function-title {
      font-size: 24rpx;
      color: #353D4B;
    }
    
    .function-desc {
      font-size: 20rpx;
      color: #353D4B;
    }
  }
}

</style>
