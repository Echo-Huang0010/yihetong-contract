<template>
  <view class="immersive-home">
    <!-- #ifdef H5 -->
    <view class="h5-page-title">{{ activeSetting.appName }}</view>
    <!-- #endif -->
    <view class="home">
      <!-- 顶部区域 -->
      <view class="top-section">
        <!-- 顶部背景图 -->
        <image class="top-bg" src="https://resource.yi-types.com/new-sign/bg_top.webp" mode="aspectFill"></image>

        <!-- Logo和标题 -->
        <view class="logo-section">
          <view class="logo logo-badge">
            <image v-if="homeLogo" class="logo-image" :src="homeLogo" mode="aspectFit" @error="handleHomeLogoError"></image>
            <text v-else class="logo-fallback-text">签</text>
          </view>
          <text class="app-title">{{ activeSetting.appName }}</text>
        </view>

        <!-- 用户身份信息卡片 -->
        <view class="user-role-card" @click="handleUserRoleClick">
          <!-- 用户卡片背景图 -->
          <image class="role-card-bg" src="https://resource.yi-types.com/new-sign/bg_role_change.webp" mode="aspectFill"></image>
          <image class="user-icon" src="https://resource.yi-types.com/new-sign/ic_user.webp" mode="aspectFit"></image>
          <text class="user-name">{{ displayName }}</text>
          <text class="user-contract-count">（剩余{{ remainingCount }}份）</text>
          <image class="role-change-icon" src="https://resource.yi-types.com/new-sign/ic_role_change.webp" mode="aspectFit"></image>
        </view>

        <!-- Banner轮播 -->
        <banner class="banner-swiper"></banner>

        <!-- 合同处理统计 -->
        <view class="contract-handle-stats">
          <!-- 统计背景图 -->
          <image class="stats-bg" src="https://resource.yi-types.com/new-sign/bg_contract_handle.webp" mode="aspectFill"></image>
          <view class="stats-content">
            <view class="stat-item" @click="switchTab(2)">
              <text class="stat-value">{{ balanceQuery.myHandle || 0 }}</text>
              <text class="stat-label">待我处理</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item" @click="switchTab(3)">
              <text class="stat-value">{{ balanceQuery.othersHandle || 0 }}</text>
              <text class="stat-label">待他人处理</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item" @click="switchTab(4)">
              <text class="stat-value">{{ balanceQuery.signedContractCount || 0 }}</text>
              <text class="stat-label">签署完成</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 按钮区域 -->
      <view class="button-section" :class="{ 'button-section--guest': !token }">
        <template v-if="token">
          <view class="feature-row feature-row-large">
            <view class="feature-card feature-card-large" @click="navigateTo('/pages/contract/sign/index', true)">
              <image class="feature-icon" src="/static/home_feature_sign.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">发起签署</text>
                <text class="feature-desc">快速发起电子合同</text>
              </view>
              <text class="feature-arrow">›</text>
            </view>

            <view class="feature-card feature-card-large" v-if="activeSetting.contractCompareEnabled !== false" @click="navigateTo('/pages/contract/compare/index', false)">
              <image class="feature-icon" src="/static/home_feature_compare.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">合同比对</text>
                <text class="feature-desc">智能比对合同差异</text>
              </view>
              <text class="feature-arrow">›</text>
            </view>
          </view>

          <view class="feature-row feature-row-small">
            <view class="feature-card feature-card-small" v-if="activeSetting.contractAuditEnabled !== false" @click="navigateTo('/pages/contract/audit/index', false)">
              <image class="feature-icon feature-icon-small" src="/static/home_feature_audit.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">合同审查</text>
                <text class="feature-desc">智能审查风险</text>
              </view>
              <text class="feature-arrow feature-arrow-muted">›</text>
            </view>

            <view class="feature-card feature-card-small" v-if="activeSetting.aiContractEnabled !== false" @click="navigateTo('/pages/user/file/aiGenerate', false)">
              <image class="feature-icon feature-icon-small" src="/static/home_feature_generate.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">生成合同</text>
                <text class="feature-desc">一键生成合同</text>
              </view>
              <text class="feature-arrow feature-arrow-muted">›</text>
            </view>

            <view class="feature-card feature-card-small" @click="navigateTo('/pages/home/draft/index', true)">
              <image class="feature-icon feature-icon-small" src="/static/home_feature_draft.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">草稿发起</text>
                <text class="feature-desc">管理草稿</text>
              </view>
              <text class="feature-arrow feature-arrow-muted">›</text>
            </view>
          </view>
        </template>

        <template v-else>
          <view class="guest-login-strip" @click="goLogin">
            <image class="guest-login-icon" src="/static/home_feature_user.svg" mode="aspectFit"></image>
            <text class="guest-login-text">登录{{ displayAppName }}，解锁更多合同管理能力</text>
            <text class="guest-login-action">立即登录</text>
            <text class="feature-arrow">›</text>
          </view>

          <view class="feature-row feature-row-large">
            <view class="feature-card feature-card-large feature-card-locked" @click="goLogin">
              <image class="feature-icon" src="/static/home_feature_sign.svg" mode="aspectFit"></image>
              <image class="feature-lock" src="/static/home_feature_lock.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">登录后发起签署</text>
                <text class="feature-desc">登录后使用完整功能</text>
              </view>
              <text class="feature-arrow">›</text>
            </view>

            <view class="feature-card feature-card-large feature-card-locked" @click="goLogin">
              <image class="feature-icon" src="/static/home_feature_compare.svg" mode="aspectFit"></image>
              <image class="feature-lock" src="/static/home_feature_lock.svg" mode="aspectFit"></image>
              <view class="feature-copy">
                <text class="feature-title">合同比对</text>
                <text class="feature-desc">登录后使用完整功能</text>
              </view>
              <text class="feature-arrow">›</text>
            </view>
          </view>

          <view class="guest-advanced-strip" @click="goLogin">
            <image class="guest-advanced-lock" src="/static/home_feature_lock.svg" mode="aspectFit"></image>
            <text class="guest-advanced-text">合同审查、生成合同等高级功能登录后可用</text>
            <text class="guest-login-action">查看更多</text>
            <text class="feature-arrow">›</text>
          </view>
        </template>
      </view>

      <!-- 合同文书区域 -->
      <view class="document-section" @click="goToDocumentList">
        <view class="document-copy">
          <view class="document-title-row">
            <text class="document-title">合同文书</text>
            <text class="document-tag">在线编辑合同条款</text>
          </view>
          <text class="document-desc">专业合同模板，在线编辑，快速复用</text>
          <view class="document-action">
            <text>查看全部文书</text>
            <text class="document-action-arrow">›</text>
          </view>
        </view>
        <image class="document-illustration" src="/static/home_document_illustration.svg" mode="aspectFit"></image>
      </view>

      <!-- 合同模板区域 -->
      <view class="template-section">
        <CardHeader
          title="合同模板"
          moreText="查看更多"
          @more-click="navigateToContractTemplate"
        />
        <view class="template-card-list" v-if="homeTemplateCards.length">
          <view
            v-for="item in homeTemplateCards"
            :key="item.id"
            class="template-primary-card"
            @click="toTemplatePreview(item.id, item.name)"
          >
            <view class="template-primary-icon">{{ templateCardIcon(item) }}</view>
            <view class="template-primary-content">
              <text class="template-primary-title">{{ item.homeTitle || item.name }}</text>
              <text class="template-primary-desc">
                {{ item.homeSummary || item.homeTag || item.categoryName || '合同模板' }}
              </text>
            </view>
            <view class="template-primary-action">发起</view>
          </view>
        </view>
        <view v-else class="template-empty-card" @click="navigateToContractTemplate">
          <text class="template-empty-title">常用合同模板</text>
          <text class="template-empty-desc">暂无首页展示模板，点击查看全部模板</text>
        </view>
      </view>

      <!-- 甄选内容区域 -->
      <view class="content-section" v-if="showContentSection && newsList.length">
        <CardHeader
          title="甄选内容"
          moreText="查看更多"
          @more-click="switchContent"
        />

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
      </view>

    </view>
    <tabbar></tabbar>
  </view>
</template>

<script>
import userInfoApi from '@/api/api.js';
import contractCard from './components/contractCard';
import banner from './components/banner';
import CardHeader from '@/components/CardHeader';
import { mapState, mapActions } from 'vuex';
import setting from '@/config/setting.js';
import config from '@/config/index.js';
import { getNewsList } from '@/api/news.js';
import { recommendedTemplateList } from '@/api/file.js';
import { CONTENT_COVER_FALLBACK, normalizeContentRows } from '@/utils/content-assets.js';

export default {
  components: { contractCard, banner, CardHeader },
  data() {
    return {
      contract: [], //合同数组
      balanceQuery: '', //余额 与 待处理
      list: [],
      appId: config.appId,
      setting,
      newsList: [], // 企业服务列表
      defaultName: '未登录',
      defaultCount: 0,
      recommendedTemplates: [],
      contentCoverFallback: CONTENT_COVER_FALLBACK,
      homeLogoFailed: false,
    };
  },
  onShow() {
    this.init();
    uni.setNavigationBarTitle({
      title: this.activeSetting.appName,
    });
    uni.removeStorageSync('signing');

    // 设置状态栏高度CSS变量
    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    // document.documentElement.style.setProperty('--status-bar-height', statusBarHeight + 'px');
  },
  computed: {
    ...mapState(['token', 'userInfo', 'brandConfig']),
    homeTemplateCards() {
      return this.recommendedTemplates.slice(0, 1);
    },
    activeSetting() {
      return this.brandConfig || this.setting;
    },
    homeLogo() {
      if (this.homeLogoFailed) return '';
      return this.activeSetting.logoIcon ||
        this.activeSetting.logoSquare ||
        this.activeSetting.logo ||
        this.activeSetting.miniNavLogo ||
        this.setting.logoIcon;
    },
    showContentSection() {
      return this.activeSetting.serviceAssistantEnabled !== false;
    },
    displayName() {
      if (!this.token) return this.defaultName;
      if (!this.userInfo) return this.defaultName;

      return this.userInfo.identityType === 1
        ? this.userInfo.companyName
        : (this.userInfo.nickname || this.userInfo.phone || '未知用户');
    },
    remainingCount() {
      if (!this.token || !this.userInfo) return this.defaultCount;

      const meal = this.balanceQuery || {};
      if (this.userInfo.identityType === 1) {
        return this.userInfo.companyMealCount !== undefined
          ? this.userInfo.companyMealCount
          : (meal.companyMealCount || 0);
      }
      return this.userInfo.individualMealCount !== undefined
        ? this.userInfo.individualMealCount
        : (meal.personalMealCount || meal.individualMealCount || 0);
    }
  },
  methods: {
    ...mapActions(['uinfo']),
    async init() {
      this.getRecommendedTemplates();
      if (this.showContentSection) {
        this.getNewsList();
      } else {
        this.newsList = [];
      }

      if (!this.token) {
        return;
      }
      this.uinfo({ silent: true });
      await userInfoApi.balanceQuery({ silent: true }).then(data => {
        this.balanceQuery = data;
        // 如果API没有返回完成状态，设置默认值为0
        if (this.balanceQuery && !this.balanceQuery.completed) {
          this.balanceQuery.completed = 0;
        }
      }).catch(() => {
        this.balanceQuery = {};
      });
      await userInfoApi
        .contractList({
          pageNum: 1,
          pageSize: 10,
        }, { silent: true })
        .then(data => {
          this.contract = data.rows;
        })
        .catch(() => {
          this.contract = [];
        });
    },

    async getRecommendedTemplates() {
      try {
        const recommended = await recommendedTemplateList(
          {
            limit: 6,
          },
          { silent: true }
        );
        const recommendedRows = Array.isArray(recommended)
          ? recommended
          : ((recommended && recommended.rows) || []);
        // 首页只展示后台明确标记为推荐的模板；推荐为空时保持为空，
        // 不能回退普通模板，否则会绕过“首页展示”开关。
        this.recommendedTemplates = recommendedRows
          .filter(item => item && item.enableState !== false && item.enableState !== 0)
          .slice(0, 6);
      } catch (error) {
        this.recommendedTemplates = [];
      }
    },

    templateCardIcon(item) {
      const source = item.homeTag || item.categoryName || item.homeTitle || item.name || '合';
      return String(source).trim().slice(0, 1) || '合';
    },

    handleContentCoverError(item) {
      if (item && item.coverUrl !== CONTENT_COVER_FALLBACK) {
        this.$set(item, 'coverUrl', CONTENT_COVER_FALLBACK);
      }
    },

    handleHomeLogoError() {
      this.homeLogoFailed = true;
    },

    // 跳转到合同模板列表
    navigateToContractTemplate() {
      if (!this.token) {
        this.common.toLogin();
        return;
      }
      uni.navigateTo({
        url: '/pages/template/index'
      });
    },

    // 跳转到文书列表页
    goToDocumentList() {
      uni.navigateTo({
        url: '/pages/user/template/document-list'
      });
    },

    // 跳转到企业服务tab
    // goToServiceTab() {
    //   uni.switchTab({
    //     url: '/pages/content/index'
    //   });
    // },

    // 查看企业服务详情
    viewContent(item) {
      uni.navigateTo({
        url: `/pages/content/detail?id=${item.id}`
      });
    },
    switchContent(){
        if (!this.showContentSection) {
            return;
        }
        uni.navigateTo({
            url: '/pages/content/selected',
        });
    },
    navigateTo(url, checkLogin) {
      if (checkLogin && !this.token) {
        this.common.toLogin();
        return;
      }
      if (url === '/pages/home/contractTemplate/index') {
        uni.navigateTo({
          url: '/pages/template/index',
        });
        return;
      }
      // 特殊处理合同模板页面
      if (url === '/pages/template/index') {
        uni.navigateTo({
          url: '/pages/template/index',
        });
        return;
      }
      this.common.navigateTo(url);
    },
    goLogin() {
      this.common.toLogin();
    },
    switchTab(type) {
      uni.setStorageSync('contractType', type);
      this.common.switchTab('/pages/contract/index');
    },
    toPreview(id, name) {
      if (!this.token) {
        this.common.toLogin();
        return;
      }
      uni.navigateTo({
        url: `/pages/contract/sign/signByTemplate?tid=${id}`,
      });
    },

    // 模板预览方法
    toTemplatePreview(id, name) {
      if (!this.token) {
        this.common.toLogin();
        return;
      }
      uni.navigateTo({
        url: `/pages/contract/sign/signByTemplate?tid=${id}`,
      });
    },
    handleUserRoleClick() {
      if (!this.token) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
        return;
      }

      // 如果用户未认证，跳转到认证页面
      if (this.userInfo && !this.userInfo.authentication) {
        uni.navigateTo({
          url: '/pages/user/personal/Certification'
        });
        return;
      }

      // 如果已认证，则打开身份切换
      uni.navigateTo({
        url: '/pages/user/setting/changeIdentity'
      });
    },
    // 获取企业服务列表
    async getNewsList() {
      try {
        const res = await getNewsList({
          pageNum: 1,
          pageSize: 3,
          publishStatus: 'PUBLISHED'
        }, { silent: true });

        if (res && res.code === 0 && res.data && res.data.rows) {
          this.newsList = normalizeContentRows(res.data.rows);
        } else if (res && res.data && res.data.rows === undefined) {
          this.newsList = normalizeContentRows(res.data);
        } else if (res && res.rows) {
          this.newsList = normalizeContentRows(res.rows);
        } else {
          this.newsList = [];
        }
      } catch (error) {
        this.newsList = [];
      }
    },
  },
  onLoad(options) {
    // 处理从其他小程序调起的参数
    if(options.type && options.id) {
      // 将参数存储到本地
      uni.setStorageSync('external_params', {
        type: options.type,
        id: options.id
      });
    }

    // 处理邀请码
    if(options.inviteCode) {
      uni.setStorageSync('inviteCode', options.inviteCode);
    }
  },
};
</script>

<style lang="scss" scoped>
.immersive-home {
  width: 100%;
  min-height: 100vh;
  background-color: #F6FAFF;
  padding: 0;
  margin: 0;
}

.home {
  width: 100%;
  padding: 0;
  padding-bottom: calc(172rpx + env(safe-area-inset-bottom));
  position: relative;
  margin: 0;
}

/* 顶部区域 */
.top-section {
  width: 100%;
  height: calc(648rpx + var(--status-bar-height, 0px));
  padding: 0 30rpx;
  position: relative;
  margin-top: 0;
  padding-top: var(--status-bar-height, 0px);
  box-sizing: border-box;

  .top-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .logo-section {
    margin-top: 56rpx;
    margin-left: 2rpx;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 2;

    .logo {
      width: 56rpx;
      height: 56rpx;
    }

    .logo-badge {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16rpx;
      background: #FFFFFF;
      overflow: hidden;
      box-shadow: 0 8rpx 18rpx rgba(0, 56, 144, 0.16);
    }

    .logo-image {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
    }

    .logo-fallback-text {
      color: #1677FF;
      font-size: 30rpx;
      font-weight: 700;
      line-height: 56rpx;
      z-index: 1;
    }

    .app-title {
      margin-left: 24rpx;
      color: #FFFFFF;
      font-size: 30rpx;
    }
  }

  .user-role-card {
    margin-top: 28rpx;
    width: 100%;
    height: 80rpx;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 2;

    .role-card-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .user-icon {
      margin-left: 30rpx;
      width: 48rpx;
      height: 48rpx;
      position: relative;
      z-index: 2;
    }

    .user-name {
      margin-left: 6rpx;
      color: #FFFFFF;
      font-size: 26rpx;
      font-weight: bold;
      position: relative;
      z-index: 2;
    }

    .user-contract-count {
      color: #FFFFFF;
      font-size: 26rpx;
      position: relative;
      z-index: 2;
    }

    .role-change-icon {
      position: absolute;
      right: 30rpx;
      width: 24rpx;
      height: 26rpx;
      z-index: 2;
    }
  }

  .banner-swiper {
    margin-top: 16rpx !important;
    width: 100%;
    height: 236rpx;
    position: relative;
    z-index: 2;
    display: block;

    :deep(.swiper-dots) {
      display: flex;
      justify-content: center;
      margin-bottom: 28rpx;

      .swiper-dot-active {
        background-color: #317CFF !important;
      }
    }
  }

  .contract-handle-stats {
    margin-top: 20rpx;
    width: 100%;
    height: 150rpx;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 2;
    .stats-content{
      width: 100%;
      height: 100%;
       display: flex;
      align-items: center;
      margin-left: 30rpx;
      margin-right: 30rpx;
       margin-bottom: 32rpx;
     position: relative;
    }
    .stats-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 2;

      .stat-value {
        font-size: 48rpx;
        color: #FFFFFF;
        font-weight: bold;
      }

      .stat-label {
        color: #E4EFFF;
        font-size: 22rpx;
      }
    }

    .stat-divider {
      width: 2rpx;
      height: 56rpx;
      background-color: #E5F0FF;
      position: relative;
      z-index: 2;
    }
  }
}

/* 按钮区域 */
.button-section {
  margin: 30rpx;
  width: calc(100% - 60rpx);
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;

  .func-item {
    flex: 0 0 calc((100% - 18rpx) / 2);
    width: calc((100% - 18rpx) / 2);
    height: 140rpx;
    min-width: 0;
    border-radius: 20rpx;
    background: #FFFFFF;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    align-content: center;
    justify-content: flex-start;
    padding: 0 26rpx;
    box-sizing: border-box;
    box-shadow: 0 8rpx 24rpx rgba(31, 45, 61, 0.06);

    .func-icon {
      width: 58rpx;
      height: 58rpx;
      flex: 0 0 auto;
    }

    .func-text {
      margin-top: 0;
      margin-left: 16rpx;
      font-size: 27rpx;
      color: #353D4B;
      font-weight: 600;
      white-space: nowrap;
      max-width: calc(100% - 74rpx);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .func-desc {
      flex: 0 0 100%;
      margin-top: 4rpx;
      margin-left: 74rpx;
      font-size: 20rpx;
      color: #8A94A6;
    }
  }

  .start-sign-item {
    flex: 0 0 100%;
    width: 100%;
    height: 132rpx;
    background: linear-gradient(135deg, #1467FF 0%, #36B7FF 100%);
    box-shadow: 0 18rpx 36rpx rgba(20, 103, 255, 0.24);
    justify-content: flex-start;

    .start-icon {
      width: 66rpx;
      height: 66rpx;
      line-height: 62rpx;
      border-radius: 50%;
      text-align: center;
      color: #1467FF;
      background: #FFFFFF;
      font-size: 44rpx;
      font-weight: 600;
      flex: 0 0 auto;
    }

    .func-text {
      color: #FFFFFF;
      font-weight: 600;
      font-size: 31rpx;
      max-width: calc(100% - 92rpx);
    }

    .func-desc {
      color: rgba(255, 255, 255, 0.82);
    }
  }

  .func-item:not(.start-sign-item):last-child:nth-child(even) {
    flex-basis: 100%;
    width: 100%;
  }
}

/* 合同文书区域 */
.document-section {
  margin: 0 30rpx 280rpx;
  width: calc(100% - 60rpx);
  height: 160rpx;
  position: relative;

  .document-bg {
    width: 100%;
    height: 100%;
  }
}

/* 合同模板区域 */
.template-section {
  margin: 0 30rpx 30rpx;
  width: calc(100% - 60rpx);
  border-radius: 24rpx;
  background: #FFFFFF;
  padding: 30rpx;

  .template-card-list {
    margin-top: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 18rpx;
  }

  .template-primary-card {
    width: 100%;
    display: flex;
    align-items: center;
    min-height: 168rpx;
    padding: 28rpx;
    border-radius: 18rpx;
    background: linear-gradient(135deg, #f6f9ff 0%, #eaf2ff 100%);
    box-sizing: border-box;
    border: 1rpx solid #dfeaff;

    .template-primary-icon {
      width: 76rpx;
      height: 76rpx;
      border-radius: 20rpx;
      background: #317cff;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      font-weight: 600;
      flex-shrink: 0;
    }

    .template-primary-content {
      flex: 1;
      min-width: 0;
      padding: 0 24rpx;
      display: flex;
      flex-direction: column;
    }

    .template-primary-title {
      font-size: 30rpx;
      line-height: 42rpx;
      color: #1f2d3d;
      font-weight: 600;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .template-primary-desc {
      margin-top: 10rpx;
      font-size: 24rpx;
      color: #6e7c93;
    }

    .template-primary-action {
      width: 92rpx;
      height: 56rpx;
      border-radius: 28rpx;
      background: #ffffff;
      color: #317cff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26rpx;
      font-weight: 600;
      flex-shrink: 0;
    }
  }

  .template-empty-card {
    margin-top: 24rpx;
    min-height: 136rpx;
    border-radius: 18rpx;
    background: #f7faff;
    border: 1rpx dashed #c9daf8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .template-empty-title {
    font-size: 28rpx;
    color: #1f2d3d;
    font-weight: 600;
  }

  .template-empty-desc {
    margin-top: 10rpx;
    font-size: 24rpx;
    color: #6e7c93;
  }
}

/* 甄选内容区域 */
.content-section {
  margin: 30rpx;
  width: calc(100% - 60rpx);
  background: #ffffff;
  border-radius: 30rpx;
  padding: 30rpx;
  margin-bottom: 120rpx;

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
    margin-top: 30rpx;
    text-align: center;
  }
}

.text-overflow-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Flagship home polish: stable in Mini Program and H5 when all modules are enabled. */
.immersive-home {
  background: #f3f6fb;
}

.home {
  padding-bottom: calc(196rpx + env(safe-area-inset-bottom));
}

.top-section {
  height: calc(664rpx + var(--status-bar-height, 0px));
  padding-left: 30rpx;
  padding-right: 30rpx;
  overflow: visible;

  .top-bg {
    opacity: 0.98;
  }

  .logo-section {
    margin-top: 60rpx;

    .logo {
      width: 58rpx;
      height: 58rpx;
    }

    .app-title {
      margin-left: 18rpx;
      font-size: 33rpx;
      font-weight: 650;
      letter-spacing: 0;
    }
  }

  .user-role-card {
    margin-top: 28rpx;
    height: 84rpx;

    .user-icon {
      margin-left: 32rpx;
      width: 50rpx;
      height: 50rpx;
    }

    .user-name,
    .user-contract-count {
      font-size: 26rpx;
      line-height: 36rpx;
      white-space: nowrap;
    }

    .user-name {
      max-width: 420rpx;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .banner-swiper {
    margin-top: 24rpx !important;
    height: 270rpx;
    border-radius: 24rpx;
    overflow: hidden;
  }

  .contract-handle-stats {
    margin-top: 22rpx;
    height: 150rpx;

    .stats-content {
      margin-left: 26rpx;
      margin-right: 26rpx;
      margin-bottom: 26rpx;
    }

    .stat-item {
      .stat-value {
        font-size: 46rpx;
        line-height: 56rpx;
      }

      .stat-label {
        margin-top: 2rpx;
        font-size: 22rpx;
      }
    }
  }
}

.button-section {
  margin: 16rpx 30rpx 24rpx;
  width: calc(100% - 60rpx);
  min-height: 0;
  padding: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.feature-row {
  display: flex;
  width: 100%;
  gap: 20rpx;
}

.feature-row-large {
  min-height: 160rpx;
}

.feature-row-small {
  min-height: 132rpx;
}

.feature-card {
  min-width: 0;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  display: grid;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  border: 1rpx solid #cfe0fb;
  border-radius: 16rpx;
  box-shadow: 0 14rpx 32rpx rgba(55, 118, 210, 0.08);
}

.feature-card-large {
  flex: 1 1 0;
  height: 160rpx;
  grid-template-columns: 78rpx minmax(0, 1fr) 18rpx;
  column-gap: 16rpx;
  padding: 22rpx 18rpx 22rpx 22rpx;
}

.feature-card-small {
  flex: 1 1 0;
  height: 132rpx;
  grid-template-columns: 54rpx minmax(0, 1fr) 14rpx;
  column-gap: 12rpx;
  padding: 18rpx 12rpx 18rpx 14rpx;
}

.feature-icon {
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 auto;
  grid-column: 1;
  grid-row: 1;
}

.feature-icon-small {
  width: 54rpx;
  height: 54rpx;
}

.feature-copy {
  margin-left: 0;
  min-width: 0;
  width: 100%;
  display: grid;
  grid-template-rows: 38rpx 30rpx;
  align-content: center;
  row-gap: 0;
  grid-column: 2;
  grid-row: 1;
}

.feature-title {
  grid-row: 1;
  display: block;
  height: 38rpx;
  font-size: 30rpx;
  line-height: 38rpx;
  color: #111827;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-desc {
  grid-row: 2;
  display: block;
  height: 30rpx;
  margin-top: 0;
  font-size: 23rpx;
  line-height: 30rpx;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-card-small .feature-copy {
  margin-left: 0;
  grid-template-rows: 30rpx 24rpx;
}

.feature-card-small .feature-title {
  height: 30rpx;
  font-size: 25rpx;
  line-height: 30rpx;
  font-weight: 650;
}

.feature-card-small .feature-desc {
  height: 24rpx;
  margin-top: 0;
  font-size: 19rpx;
  line-height: 24rpx;
}

.feature-arrow {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  align-self: center;
  color: #2478ff;
  font-size: 46rpx;
  line-height: 46rpx;
  font-weight: 300;
}

.feature-arrow-muted {
  color: #7f8da3;
  font-size: 34rpx;
  line-height: 34rpx;
}

.feature-card-locked {
  opacity: 0.96;
}

.feature-lock {
  position: absolute;
  left: 96rpx;
  bottom: 24rpx;
  width: 34rpx;
  height: 34rpx;
}

.guest-login-strip,
.guest-advanced-strip {
  height: 72rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
  border: 1rpx solid #cfe0fb;
  box-shadow: 0 12rpx 26rpx rgba(55, 118, 210, 0.06);
}

.guest-login-icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 18rpx;
}

.guest-login-text,
.guest-advanced-text {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  line-height: 34rpx;
  color: #263348;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guest-login-action {
  margin-left: 14rpx;
  font-size: 25rpx;
  color: #2478ff;
  font-weight: 600;
  white-space: nowrap;
}

.guest-advanced-lock {
  width: 28rpx;
  height: 28rpx;
  margin-right: 14rpx;
}

.button-section--guest {
  gap: 22rpx;
}

.document-section {
  margin: 0 30rpx 22rpx;
  width: calc(100% - 60rpx);
  height: 248rpx;
  padding: 32rpx 34rpx 30rpx;
  box-sizing: border-box;
  border-radius: 22rpx;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.96) 48%, rgba(237, 246, 255, 0.92) 100%);
  border: 1rpx solid #cfe0fb;
  overflow: hidden;
  box-shadow: 0 14rpx 32rpx rgba(55, 118, 210, 0.08);
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180rpx, 322rpx);
  align-items: center;

  .document-copy {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-rows: 38rpx 33rpx 58rpx;
    align-content: center;
    row-gap: 16rpx;
    grid-column: 1;
    min-width: 0;
  }

  .document-title-row {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .document-title {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .document-title {
    font-size: 29rpx;
    line-height: 38rpx;
    color: #111827;
    font-weight: 620;
  }

  .document-tag {
    flex-shrink: 0;
    margin-left: 18rpx;
    height: 32rpx;
    padding: 0 13rpx;
    border-radius: 9rpx;
    border: 1rpx solid #8db9ff;
    color: #2563eb;
    font-size: 20rpx;
    line-height: 32rpx;
  }

  .document-desc {
    margin-top: 0;
    font-size: 24rpx;
    line-height: 33rpx;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .document-action {
    margin-top: 0;
    min-width: 200rpx;
    max-width: 260rpx;
    height: 58rpx;
    padding: 0 20rpx;
    box-sizing: border-box;
    white-space: nowrap;
    flex-shrink: 0;
    border-radius: 9rpx;
    background: linear-gradient(180deg, #2f7cff 0%, #1265ff 100%);
    color: #ffffff;
    font-size: 24rpx;
    line-height: 58rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 20rpx rgba(37, 112, 255, 0.22);
  }

  .document-action-arrow {
    margin-left: 10rpx;
    font-size: 28rpx;
    line-height: 28rpx;
    flex-shrink: 0;
  }

  .document-illustration {
    position: relative;
    right: auto;
    bottom: auto;
    justify-self: end;
    width: 100%;
    max-width: 336rpx;
    height: 234rpx;
    z-index: 1;
    opacity: 0.96;
  }
}

/* #ifdef H5 */
.document-section {
  display: block;
  position: relative;
  padding: 0;

  .document-copy {
    position: absolute;
    left: 34rpx;
    top: 34rpx;
    width: 356rpx;
    height: 194rpx;
    display: grid;
    grid-template-rows: 56rpx 42rpx 64rpx;
    row-gap: 16rpx;
    align-content: start;
    margin: 0;
  }

  .document-title-row,
  .document-desc,
  .document-action {
    position: static;
  }

  .document-illustration {
    position: absolute;
    right: 36rpx;
    top: 32rpx;
  }
}
/* #endif */

.template-section,
.content-section {
  margin-left: 30rpx;
  margin-right: 30rpx;
  width: calc(100% - 60rpx);
  border-radius: 28rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 28rpx rgba(34, 73, 122, 0.07);
}

.template-section {
  margin-bottom: 26rpx;

  .template-card-list {
    gap: 16rpx;
  }

  .template-primary-card {
    min-height: 146rpx;
    padding: 24rpx;
    border-radius: 20rpx;
  }
}

.content-section {
  margin-top: 26rpx;
  margin-bottom: 138rpx;
}

/* #ifdef H5 */
.h5-page-title {
  display: none;
}

.top-section {
  height: 652rpx;
  padding-top: 0;
  margin-top: 0;
  overflow: hidden;

  .logo-section {
    margin-top: 42rpx;
  }
}

.button-section,
.document-section {
  max-width: 800rpx;
  margin-left: auto;
  margin-right: auto;
}
/* #endif */
</style>

