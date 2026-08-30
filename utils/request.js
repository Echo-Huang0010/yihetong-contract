/*
 * @Author: wudi
 * @Date: 2023-12-11 14:42:14
 * @LastEditors: wudi
 * @LastEditTime: 2023-12-14 17:11:31
 * @Description:
 */
import config from '@/config/index.js';
import store from '../store/index.js';

function readableMessage(value, fallback) {
  if (value === null || value === undefined) return fallback;
  const message = String(value).trim();
  return !message || message.toLowerCase() === 'null' || message.toLowerCase() === 'undefined' ? fallback : message;
}

function request(obj) {
  var data = Object.assign({}, obj.data),
    url = obj.url,
    silent = obj.silent === true;
  // #ifdef MP-WEIXIN
  url = config.getBaseUrl() + obj.url;
  // #endif
  // #ifdef H5
  url = config.getBaseUrl() + obj.url;
  // #endif
  var headers = {
    'x-access-token': store.state.token,
    'content-type': 'application/json',
  };
  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: obj.method,
      data,
      dataType: 'json',
      timeout: 2 * 60000,
      header: headers,
      success: function(res) {
        if(res.header && res.header['content-type'] === 'image/jpeg'){
            resolve(res.data);
            return;
        }
        if (res.data && res.data.flag) {
          resolve(res.data.data);
        } else if (res.data && res.data.code === 0) {
          resolve(res.data.data !== undefined ? res.data.data : res.data);
        } else {
          const code = res.data && res.data.code;
          const message = readableMessage(res.data && res.data.message, '请求失败');
          if (code == 1000) {
            store.commit('setToken', '');
            uni.removeStorageSync('token');
            store.commit('setUserInfo', '');
            uni.showModal({
              title: '异地登录提醒',
              content: '您的账号在其他设备登录，如非本人请及时更换密码！',
              confirmText: '去登录',
              confirmColor: '#317CFF',
              showCancel: false,
              success: function(res) {
                if (res.confirm) {
                  uni.reLaunch({
                    url: '/pages/login/login?logout=1',
                  });
                }
              },
            });
            reject();
          } else if (code == 1010 || code == 1051) {
            store.commit('setToken', '');
            uni.removeStorageSync('token');
            store.commit('setUserInfo', '');
            uni.showModal({
                title: '登录失效提醒',
                content: res.data.message,
                confirmText: '去登录',
                confirmColor: '#317CFF',
                showCancel: true,
                success: function(res) {
                  if (res.confirm) {
                    // token过期
                    uni.reLaunch({
                        url: '/pages/login/login',
                    });
                  }
                },
              });

            // this.$store.dispatch('login').then(res => {
            //   resolve(request(obj));
            // });
          } else {
            reject(res.data);
            if (!silent) {
              uni.showToast({
                title: message,
                icon: 'none',
                duration: 1500,
              });
            }
          }
        }
      },
      fail: function(res) {
        reject();
        if (!silent) {
          uni.showToast({
            title: '网络异常，请检查网络！',
            icon: 'none',
          });
        }
      },
    });
  });
}
export default request;
