<template>
  <view
    class="authorize-page"
    :class="{
      'authorize-h5': isH5Mode,
      'authorize-sign-h5': isSignPath && isH5Mode
    }"
  >
    <web-view class="auth-web-view" :src="path" @message="handleMessage"></web-view>
    <view
      v-if="showReturnBar"
      class="auth-return-bar"
      :class="{
        'auth-return-bar-h5': isH5Mode,
        'auth-return-bar-sign-h5': isSignPath && isH5Mode
      }"
    >
      <view
        class="auth-return-btn"
        :class="{
          'auth-return-btn-h5': isH5Mode,
          'auth-return-btn-sign-h5': isSignPath && isH5Mode
        }"
        @click="returnFromAuth"
      >
        {{ returnButtonText }}
      </view>
    </view>
  </view>
</template>

<script>
import config from '@/config/index.js';
import userInfoApi from '@/api/api.js';
import { getCompanyState } from '@/api/company.js';
import { mapActions } from 'vuex';

export default {
  data() {
    return {
      path: '',
      isAuthPath: false,
      isCompanyAuth: false,
      isSignPath: false,
      contractId: '',
      originType: '',
      authSource: '',
      returning: false,
    };
  },
  computed: {
    showReturnBar() {
      return this.isAuthPath || this.isCompanyAuth || this.isSignPath;
    },
    returnButtonText() {
      if (this.isSignPath) {
        return this.contractId && !this.isH5Mode ? '返回合同详情' : '返回详情';
      }
      return '已完成，返回同步';
    },
    isH5Mode() {
      // #ifdef H5
      return true;
      // #endif
      // #ifndef H5
      return false;
      // #endif
    },
  },
  onLoad(e) {
    console.log('authorize page options:', e);
    if (e.tid && e.uid) {
      if (!uni.getStorageSync('token')) {
        uni.navigateTo({
          url: '/pages/login/login?tid=' + e.tid + '&uid=' + e.uid,
        });
        return;
      }
      this.path = config.manageAdminUrl + 'contract?tid=' + e.tid + '&token=' + uni.getStorageSync('token');
      uni.setNavigationBarTitle({
        title: '合同模板预览',
      });
      return;
    }

    if (e.path) {
      this.path = decodeURIComponent(e.path);

      if (e.source) {
        this.authSource = e.source;
        this.isCompanyAuth = this.authSource === 'company';
        this.isAuthPath = this.authSource === 'personal';
        this.isSignPath = this.authSource === 'sign';
      } else if (this.isExternalSignUrl(this.path)) {
        this.isSignPath = true;
      } else if (
        this.path.includes('/auth/') ||
        this.path.includes('authUser') ||
        this.path.includes('authFlowId') ||
        this.path.includes('rzw')
      ) {
        this.isCompanyAuth = this.path.includes('authFlowId') || this.path.includes('rzw');
        this.isAuthPath = !this.isCompanyAuth;
      }

      if (e.contractId) {
        this.contractId = e.contractId;
      }
      if (e.originType) {
        this.originType = e.originType;
      }

      try {
        const urlParams = this.path.includes('?')
          ? new URLSearchParams(this.path.split('?')[1])
          : new URLSearchParams('');

        if (urlParams.has('contractId')) {
          this.contractId = urlParams.get('contractId');
        }
        if (urlParams.has('originType')) {
          this.originType = urlParams.get('originType');
        }
      } catch (error) {
        console.log('parse auth url failed:', error);
      }
    }

    if (e.title) {
      uni.setNavigationBarTitle({
        title: e.title,
      });
    }
  },
  onUnload() {
    console.log('authorize unload:', this.isAuthPath, this.isCompanyAuth, this.isSignPath);
    if (this.returning) {
      return;
    }

    if (this.isCompanyAuth) {
      this.handleCompanyAuthReturn();
      return;
    }

    if (this.isAuthPath) {
      this.handlePersonalAuthReturn();
    }
  },
  methods: {
    ...mapActions(['uinfo']),

    updateUserInfo() {
      return this.uinfo();
    },

    isExternalSignUrl(url) {
      const value = String(url || '');
      return (
        value.includes('/mesign/') ||
        value.includes('tsign_source_type=SIGN_LINK') ||
        (value.includes('flowId=') && value.includes('bizType=1'))
      );
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    returnFromAuth() {
      if (this.isSignPath) {
        this.returnFromSign();
        return;
      }
      if (this.isCompanyAuth) {
        this.returning = true;
        this.handleCompanyAuthReturn();
        return;
      }
      if (this.isAuthPath) {
        this.handlePersonalAuthReturn();
        return;
      }
      uni.navigateBack();
    },

    returnFromSign() {
      this.returning = true;
      if (this.contractId) {
        uni.setStorageSync('pending_sign_contract_id', this.contractId);
        const detailUrl = '/pages/contract/detail/index?id=' + this.contractId + '&syncSign=1&t=' + Date.now();
        userInfoApi
          .syncContractSignStatus(this.contractId, { silent: true })
          .catch(() => false)
          .then(() => {
            uni.redirectTo({
              url: detailUrl,
            });
          });
        return;
      }
      uni.navigateBack();
    },

    handlePersonalAuthReturn() {
      if (this.returning) {
        return;
      }
      this.returning = true;
      uni.setStorageSync('auth_waiting', true);
      uni.setStorageSync('auth_poll_time', Date.now());

      if (this.contractId) {
        uni.setStorageSync('auth_contract_id', this.contractId);
      }

      if (this.originType) {
        uni.setStorageSync('auth_origin_type', this.originType);
      }

      let redirectUrl = '/pages/user/personal/authWaiting';
      const params = [];

      if (this.contractId) {
        params.push(`id=${this.contractId}`);
      }

      if (this.originType) {
        params.push(`originType=${this.originType}`);
      }

      if (params.length > 0) {
        redirectUrl += '?' + params.join('&');
      }

      setTimeout(() => {
        uni.redirectTo({
          url: redirectUrl,
        });
      }, 100);
    },

    getCompanyAuthLandingUrl() {
      if (this.originType === 'mine') {
        return '/pages/user/index';
      }
      if (this.originType === 'sign' && this.contractId) {
        return '/pages/contract/detail/index?id=' + this.contractId;
      }
      return '/pages/home/index';
    },

    getCompanyAuthStateParams() {
      if (this.originType === 'sign' && this.contractId) {
        return {
          type: 7,
          params: this.contractId,
        };
      }
      return {
        type: 6,
        params: '',
      };
    },

    async syncCompanyAuthState() {
      const stateParams = this.getCompanyAuthStateParams();
      try {
        await getCompanyState(stateParams, { silent: true });
      } catch (err) {
        console.log('sync company auth state failed:', err);
      }
    },

    async waitForCompanyIdentity() {
      const pendingName = uni.getStorageSync('pending_company_auth_name') || '';
      for (let i = 0; i < 10; i++) {
        try {
          await this.syncCompanyAuthState();
          await this.uinfo({ silent: true });
          const data = await userInfoApi.enterpriseList({
            pageNum: 1,
            pageSize: 999,
          });
          const rows = data && data.rows ? data.rows : [];
          const authedRows = rows.filter(
            item => item && item.companyId && Number(item.authentication) === 1
          );
          const matched = pendingName
            ? authedRows.find(item => item.alias === pendingName)
            : null;
          if (matched) {
            return matched;
          }
          // 当前流程带有目标企业名称时，不能回退到任意历史企业，
          // 否则用户退出未完成认证也会被自动切换为已有企业身份。
          if (!pendingName && authedRows.length) {
            return authedRows[0];
          }
        } catch (err) {
          console.log('wait company identity failed:', err);
        }
        await this.sleep(1500);
      }
      return null;
    },

    async handleCompanyAuthReturn() {
      this.returning = true;
      try {
        const company = await this.waitForCompanyIdentity();
        if (company && company.companyId) {
          await userInfoApi.IdentitySwitching({
            companyId: company.companyId,
            identityType: 1,
          });
        }
        await this.uinfo({ silent: true });
      } catch (err) {
        console.error('sync company auth return failed:', err);
      } finally {
        uni.removeStorageSync('pending_company_auth_name');
        uni.removeStorageSync('pending_company_auth_origin_type');
        uni.removeStorageSync('pending_company_auth_contract_id');
        uni.reLaunch({
          url: this.getCompanyAuthLandingUrl(),
        });
      }
    },

    handleMessage(e) {
      console.log('webview message:', e);
    },
  },
};
</script>

<style lang="scss">
.authorize-page {
  min-height: 100vh;
}

.auth-web-view {
  width: 100%;
  height: 100vh;
}

.auth-return-bar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  z-index: 9999;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.auth-return-btn {
  min-width: 320rpx;
  height: 80rpx;
  padding: 0 32rpx;
  border-radius: 8rpx;
  background: #317cff;
  color: #fff;
  font-size: 28rpx;
  line-height: 80rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(49, 124, 255, 0.24);
  pointer-events: auto;
}

/* #ifdef H5 */
.authorize-h5 {
  overflow: hidden;
}

.auth-return-bar-h5 {
  top: calc(18rpx + env(safe-area-inset-top));
  bottom: auto;
  left: auto;
  right: 24rpx;
  justify-content: flex-end;
}

.auth-return-btn-h5 {
  min-width: 148rpx;
  height: 56rpx;
  padding: 0 22rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  line-height: 56rpx;
  background: rgba(49, 124, 255, 0.94);
  box-shadow: 0 4rpx 14rpx rgba(49, 124, 255, 0.22);
}
/* #endif */
</style>
