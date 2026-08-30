/*
 * @Description:
 * @LastEditTime: 2023-12-13 11:00:27
 * @LastEditors: wudi
 * @Author: 刘仁秀
 * @Date: 2022-09-02 15:21:16
 */
import App from './App';
import store from './store/index.js';
// #ifndef VUE3
import Vue from 'vue';
import widthShare from './mixins/share';
Vue.config.productionTip = false;
Vue.mixin(widthShare);
App.mpType = 'app';

// 导入阿里图标库(Unicode方式)
import './static/iconfont/iconfont.css';

// #ifdef H5
function faviconType(url) {
  const cleanUrl = String(url || '').split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.svg')) return 'image/svg+xml';
  if (cleanUrl.endsWith('.png')) return 'image/png';
  if (cleanUrl.endsWith('.ico')) return 'image/x-icon';
  return 'image/x-icon';
}

function applyH5BrowserBrand(config) {
  if (typeof document === 'undefined') return;
  const brand = config || {};
  const title = brand.appName || brand.projectName || '一合通';
  const icon = brand.logoIcon || brand.logoSquare || brand.logo;
  document.title = title;
  if (!icon) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    document.head.appendChild(link);
  }
  link.setAttribute('type', faviconType(icon));
  link.setAttribute('href', icon);
}
// #endif

const app = new Vue({
  store,
  ...App,
});
// #ifdef H5
applyH5BrowserBrand(store.state.brandConfig);
// #endif
function refreshBrandConfig() {
  return store.dispatch('fetchBrandConfig').then(config => {
    // #ifdef H5
    applyH5BrowserBrand(store.state.brandConfig || config);
    // #endif
    return config;
  }).catch(() => null);
}

// 初始化全局数据对象
app.globalData = {
  tempFileInfo: null
};

app.$mount();
refreshBrandConfig();
// #endif
import common from './utils/common.js';
Vue.prototype.common = common;
import * as filters from './filters/filters.js';
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key]);
});

// #ifdef VUE3
import { createSSRApp } from 'vue';
export function createApp() {
  const app = createSSRApp(App);
  return {
    app,
    store,
  };
}
// #endif
