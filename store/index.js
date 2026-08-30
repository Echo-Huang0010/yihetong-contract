import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import {
  info
} from '@/api/login.js';
import {
  appletsLogin
} from '@/api/login.js';
import {
  getBrandConfig,
  getClientConfig
} from '@/api/brand-config.js';
import runtimeConfig from '@/config/index.js';
import setting from '@/config/setting.js';

const staticAssetFallbacks = {
  homeBannerImages: Array.isArray(setting.homeBannerImages) ? [...setting.homeBannerImages] : [],
  agentApplyBackground: setting.agentApplyBackground,
  inviteBackground: setting.inviteBackground,
  shareImage: setting.share.imageUrl,
};

function normalizeMiniAsset(value, fallback) {
  if (!value) {
    return fallback;
  }
  const normalized = String(value).trim().replace(/\\/g, '/');
  if (normalized.indexOf('/images/flagship-') === 0) {
    return normalized.replace('/images/', '/static/');
  }
  return normalized;
}

function isUsableAsset(value) {
  return /^(https?:\/\/|\/|data:image\/)/i.test(value);
}

function normalizeAssetList(value, fallback) {
  let items = value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) {
      items = [];
    } else {
      try {
        items = JSON.parse(raw);
      } catch (error) {
        items = raw.split(/\r?\n|,/);
      }
    }
  }
  if (!Array.isArray(items)) {
    items = [];
  }
  const normalized = items
    .map(item => normalizeMiniAsset(item, ''))
    .filter(isUsableAsset)
    .filter(Boolean);
  return normalized.length ? normalized : fallback;
}

function normalizeGiftCount(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : fallback;
}

function isLegacyDefaultBrandName(value) {
  return value === [setting.appName, '云签'].join('');
}

function normalizeBrandName(value, fallback) {
  const normalized = String(value || '').trim();
  if (!normalized || isLegacyDefaultBrandName(normalized)) {
    return fallback;
  }
  return normalized;
}

function safeGetStorage(key, fallback = '') {
  try {
    if (typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function') {
      const value = uni.getStorageSync(key);
      return value === undefined || value === null ? fallback : value;
    }
  } catch (error) {
    return fallback;
  }
  return fallback;
}

function normalizeBrandConfig(data) {
  const source = data || {};
  const appName = normalizeBrandName(source.projectName || source.appName, setting.appName);
  return {
    ...setting,
    ...source,
    projectName: appName,
    appName,
    companyName: source.companyName || setting.companyName,
    logo: normalizeMiniAsset(source.logo, setting.logo),
    logoWhite: normalizeMiniAsset(source.logoWhite, setting.logoWhite),
    logoSquare: normalizeMiniAsset(source.logoSquare || source.logo, setting.logoSquare),
    logoIcon: normalizeMiniAsset(source.logoIcon || source.logoSquare || source.logo, setting.logoIcon),
    // Mini-program header uses a transparent white mark so cached PC/admin logo URLs do not create a white square.
    miniNavLogo: normalizeMiniAsset(source.miniNavLogo || source.logoWhite, setting.miniNavLogo),
    loginBackground: normalizeMiniAsset(source.loginBackground, setting.loginBackground),
    homeLogoWhiteBg: normalizeMiniAsset(source.homeLogoWhiteBg, setting.homeLogoWhiteBg),
    homeBannerImages: normalizeAssetList(source.homeBannerImages, staticAssetFallbacks.homeBannerImages),
    shareImage: normalizeMiniAsset(source.shareImage, staticAssetFallbacks.shareImage),
    agentApplyBackground: normalizeMiniAsset(source.agentApplyBackground, staticAssetFallbacks.agentApplyBackground),
    inviteBackground: normalizeMiniAsset(source.inviteBackground, staticAssetFallbacks.inviteBackground),
    customerServiceQrCode: normalizeMiniAsset(source.customerServiceQrCode, ''),
    personalRegisterGiftContractCount: normalizeGiftCount(
      source.personalRegisterGiftContractCount,
      setting.personalRegisterGiftContractCount
    ),
    enterpriseRegisterGiftContractCount: normalizeGiftCount(
      source.enterpriseRegisterGiftContractCount,
      setting.enterpriseRegisterGiftContractCount
    ),
    share: {
      ...setting.share,
      title: source.shareTitle || setting.share.title,
      desc: source.shareDesc || setting.share.desc,
      imageUrl: normalizeMiniAsset(source.shareImage, staticAssetFallbacks.shareImage),
    },
  };
}

const store = new Vuex.Store({
  state: {
    userInfo: '',
    token: safeGetStorage('token', ''),
    brandConfig: normalizeBrandConfig(safeGetStorage('brandConfig', null)),
    clientConfig: safeGetStorage('clientConfig', {}),
  },
  getters: {
    getUserInfo(state) {
      return state.userInfo;
    },
  },
  mutations: {
    setToken(state, token) {
      state.token = token;
    },
    setUserInfo(state, info) {
      state.userInfo = info;
    },
    setBrandConfig(state, config) {
      state.brandConfig = normalizeBrandConfig(config);
      Object.assign(setting, state.brandConfig);
      uni.setStorageSync('brandConfig', state.brandConfig);
    },
    setClientConfig(state, config) {
      state.clientConfig = config || {};
      runtimeConfig.applyClientRuntimeConfig(state.clientConfig);
      uni.setStorageSync('clientConfig', state.clientConfig);
    },
  },
  actions: {
    login({
      commit
    }) {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.login({
          provider: 'weixin',
          success: function(loginRes) {
            appletsLogin({
                code: loginRes.code,
              })
              .then(res => {
                if (res.token) {
                  commit('setToken', res.token);
                  uni.setStorageSync('token', res.token);
                  commit('setUserInfo', res);
                  resolve(res);
                } else {
                  reject();
                }
              })
              .catch(() => {
                reject();
              });
          },
          fail() {
            reject();
          },
        });
        // #endif
        // #ifndef MP-WEIXIN
        uni.showToast({
          title: '仅支持微信小程序端！',
          icon: 'error',
        });
        // #endif
      });
    },
    uinfo({
      commit
    }, options = {}) {
      const silent = options.silent !== false;
      return info({ silent }).then(res => {
        commit('setUserInfo', res);
        return res;
      }).catch(err => {
        if (silent) {
          return null;
        }
        return Promise.reject(err);
      });
    },
    fetchBrandConfig({
      commit,
      dispatch
    }) {
      const clientConfigPromise = dispatch('fetchClientConfig');
      return getBrandConfig({ silent: true })
        .then(res => {
          commit('setBrandConfig', res);
          return res;
        })
        .catch(() => {
          commit('setBrandConfig', safeGetStorage('brandConfig', null) || normalizeBrandConfig());
        })
        .finally(() => {
          return clientConfigPromise.catch(() => null);
        });
    },
    fetchClientConfig({
      commit
    }) {
      return getClientConfig({ silent: true })
        .then(res => {
          commit('setClientConfig', res);
          return res;
        })
        .catch(() => {
          // Keep the static or explicit bootstrap endpoint when refresh fails.
          // Reapplying a cached apiBaseUrl here can strand the app on an old LAN.
          return safeGetStorage('clientConfig', {});
        });
    },
  },
});
export default store;
