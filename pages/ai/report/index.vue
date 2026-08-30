<template>
  <view class="page-container">
    <!-- 顶部背景图片 -->
    <view class="top-bg-section">
      <image class="top-bg-image" src="https://resource.yi-types.com/new-sign/bg_company_report_top.webp" mode="aspectFit" />
    </view>
    
    <!-- 报告列表 -->
    <view class="report-list">
      <view 
        v-for="(item, index) in reportList" 
        :key="index" 
        class="report-item"
        @click="viewReport(item)"
      >
        <!-- 元素1: 标题和按钮 -->
        <view class="item-header">
          <image class="header-bg" src="https://resource.yi-types.com/new-sign/img_contract_item_top.webp" />
          <view class="header-content">
            <view class="item-title">{{ item.title }}</view>
            <view class="view-btn">
              <text class="btn-text">立即查看</text>
            </view>
          </view>
        </view>
        
        <!-- 元素2: 描述文案 -->
        <view class="item-description">{{ item.description }}</view>
        
        <!-- 元素3-5: 特性列表 -->
        <view class="features-list">
          <view 
            v-for="(feature, fIndex) in item.features" 
            :key="fIndex" 
            class="feature-item"
          >
            <image class="feature-icon" src="https://resource.yi-types.com/new-sign/ic_blue_checked.webp" />
            <text class="feature-text">{{ feature }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      reportList: [
        {
          title: '融资服务',
          description: '多维度智能分析企业财税票及工商等数据，帮助企服机构为其企业客户快速匹配最佳信贷产品',
          features: ['企业经营情况', '贷款方案', '免查企业征信']
        },
        {
          title: '税务风险',
          description: '精准识别企业税务风险，帮助企服机构优化人力成本，提升服务效率，快速检测并及时发现企业客户存在的涉税风险点',
          features: ['涉税财务核算风险', '税务风险标记', '财务状况分析']
        },
        {
          title: '企业尽调',
          description: '全方位评估被调企业，判断其业务情况、实际经营状况等企业资信能力',
          features: ['数据全面', '企业360度分析', '市场情况分析']
        },
        {
          title: '供应商尽调',
          description: '全方位评估被调企业，判断其业务情况、实际经营状况等企业资信能力',
          features: ['数据全面', '企业360度分析', '市场情况分析']
        },
        {
          title: '投资尽调',
          description: '全方位评估被调企业，判断其业务情况、实际经营状况等企业资信能力',
          features: ['数据全面', '企业360度分析', '市场情况分析']
        },
        {
          title: '经营参谋',
          description: '结合授权企业所处行业、产品竞争力、经营状况等数据信息赋能企服机构优化企服产品矩阵，快速帮助授权企业了解行业动态及企业销售渠道、财务等内部经营情况',
          features: ['分析维度广', '行业动态分析', '营销策略分析']
        },
        {
          title: '财政补贴',
          description: '整合全国各地区的企业优惠政策，通过360度评估企业资质精准、快速帮助企业匹配政策项目',
          features: ['企业税收优惠匹配', '政府补贴', '企业财税政策申报方案']
        },
        {
          title: '企业全景',
          description: '多维度智能分析企业的工商、司法等数据，帮助了解企业全景',
          features: ['无需授权极速生成报告', '多维度分析企业全景', '企业情况一目了然']
        }
      ]
    };
  },
  methods: {
    viewReport(item) {
      uni.showToast({
        title: `查看${item.title}报告`,
        icon: 'none'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #F6FAFF;
}

.top-bg-section {
  width: 100%;
  height: 500rpx;
  
  .top-bg-image {
    width: 100%;
    height: 100%;
  }
}

.report-list {
  margin-top: -44rpx;
  padding-left: 30rpx;
  padding-right: 30rpx;
  padding-bottom: 30rpx;
}

.report-item {
  width: 100%;
  height: 380rpx;
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
}

.item-header {
  position: relative;
  width: 100%;
  height: 80rpx;
  
  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding-left: 30rpx;
    padding-right: 30rpx;
    
    .item-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #353D4B;
    }
    
    .view-btn {
      width: 130rpx;
      height: 48rpx;
      background-color: #317CFF;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .btn-text {
        font-size: 20rpx;
        font-weight: bold;
        color: #FFFFFF;
      }
    }
  }
}

.item-description {
  margin-top: 30rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
  font-size: 24rpx;
  color: #353D4B;
  line-height: 1.5;
}

.features-list {
  margin-top: 30rpx;
  margin-left: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  
  .feature-icon {
    width: 20rpx;
    height: 20rpx;
    margin-right: 10rpx;
  }
  
  .feature-text {
    font-size: 24rpx;
    color: #317CFF;
  }
}
</style>
