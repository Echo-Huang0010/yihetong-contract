<!--
 * @Description:
 * @LastEditTime: 2024-03-28 18:36:56
 * @LastEditors: wudi
 * @Author: 刘仁秀
 * @Date: 2022-09-02 15:21:16
-->
<template>
  <view class="page">
    <view class="login-hero">
      <image :src="loginBackground" mode="aspectFill" class="bg-image" />
      <view class="hero-mask"></view>
    </view>

    <view class="brand-panel">
      <view class="brand-logo">
        <text class="brand-logo-fallback">签</text>
        <image class="brand-logo-image" :src="loginLogo" mode="aspectFit" />
      </view>
      <text class="brand-name">{{ displayAppName }}</text>
      <text class="brand-desc">电子合同签署与管理平台</text>
    </view>

      <!-- 底部弹窗 -->
      <view class="bottom-modal">
        <view class="auth-copy">
          <!-- #ifdef MP-WEIXIN -->
          <text class="auth-title">手机号快捷登录</text>
          <text class="auth-desc">使用手机号登录后即可管理合同并使用微信支付</text>
          <!-- #endif -->
          <!-- #ifdef H5 -->
          <text class="auth-title">手机号快捷登录</text>
          <text class="auth-desc">登录后即可管理合同、查看签署进度</text>
          <!-- #endif -->
        </view>

      <!-- 同意协议 -->
      <checkBox @change="e => (checked = e)" :check="checked" />

      <!-- 短信验证码登录仅保留给 H5；小程序沿用手机号快捷登录链路。 -->
      <!-- #ifdef H5 -->
      <view class="h5-login-form">
        <input
          class="h5-login-input"
          type="number"
          maxlength="11"
          v-model.trim="form.phone"
          placeholder="手机号"
          placeholder-class="place"
        />
        <view class="h5-human-row">
          <view class="h5-human-question" @click="refreshHumanCheck">
            {{ humanCheck.question || '获取安全校验' }}
          </view>
          <input
            class="h5-login-input h5-human-input"
            type="number"
            maxlength="3"
            v-model.trim="humanCheck.answer"
            placeholder="答案"
            placeholder-class="place"
          />
        </view>
        <view class="h5-code-row">
          <input
            class="h5-login-input h5-code-input"
            type="number"
            maxlength="6"
            v-model.trim="form.verificationCode"
            placeholder="验证码"
            placeholder-class="place"
          />
          <button
            type="default"
            class="btn-code"
            :disabled="disabled"
            @click="getCode"
          >
            <text class="btn-code-text">{{ codeButtonText }}</text>
          </button>
        </view>
        <button
          type="default"
          class="btn-login"
          :disabled="disabledNext"
          @click="submit"
        >
          登录
        </button>
      </view>
      <!-- #endif -->

      <!-- #ifndef H5 -->
      <!-- 手机号快捷登录按钮；仅调整显示文案，不改变现有授权链路。 -->
      <button
        v-if="!checked"
        type="default"
        @click="showTost"
        class="btn-login"
      >
        手机号快捷登录
      </button>
      <button
        v-else-if="!privacyAuthorized"
        type="default"
        @click="showPrivacyModal"
        class="btn-login"
      >
        完成隐私授权
      </button>
      <button
        v-else
        type="default"
        open-type="getPhoneNumber"
        @getphonenumber="getPhoneNumber"
        class="btn-login"
        :disabled="phoneLoginBusy"
      >
        {{ phoneLoginBusy ? '手机号登录中…' : '手机号快捷登录' }}
      </button>
      <!-- #endif -->

      <!-- 暂不登录按钮 -->
      <view class="btn-cancel" @click="cancelLogin">暂不登录</view>
    </view>

    <!-- #ifndef H5 -->
    <wxPrivacy ref="wxPrivacy" @agree="handlePrivacyAgree"></wxPrivacy>
    <!-- #endif -->
  </view>
</template>

<script>
var that,
  timer = null,
  fastClick = true;
import reg from '@/utils/reg.js';
import { mapState, mapActions } from 'vuex';
import { login, getCode, getSmsLoginChallenge, loginBySms, appletsLogin, bind } from '@/api/login.js';
import checkBox from './checkBox.vue';
import wxPrivacy from '@/components/wxPrivacy/index.vue';
import setting from '@/config/setting.js';

function errorMessage(error, fallback) {
  if (typeof error === 'string') return error;
  if (error && error.message) return error.message;
  if (error && error.data && error.data.message) return error.data.message;
  if (error && error.errMsg) return error.errMsg;
  return fallback;
}

function showLoginError(title, error, fallback) {
  const content = errorMessage(error, fallback);
  console.warn(`[login] ${title}:`, JSON.stringify(error || {}));
  uni.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '知道了',
  });
}

function showPhoneAuthDiagnostic(detail) {
  const info = detail || {};
  const errMsg = info.errMsg || 'empty';
  console.warn('[login] getPhoneNumber diagnostic:', JSON.stringify(info));
  const isCancel = errMsg.indexOf('user deny') > -1 || errMsg.indexOf('cancel') > -1;
  uni.showModal({
    title: '手机号快捷登录失败',
    content: isCancel ? '你已取消手机号授权，请重新操作后登录。' : '未返回可用的手机号授权凭据，请重试；如反复失败，请联系管理员检查小程序配置。',
    showCancel: false,
    confirmText: '知道了',
  });
}

export default {
  components: { checkBox, wxPrivacy },
  data() {
    return {
      setting,
      passwordVisible: false,
      form: {
        password: '',
        phone: '',
        verificationCode: '',
      },
      humanCheck: {
        phone: '',
        question: '',
        token: '',
        answer: '',
      },
      disabled: false,
      codeCountdown: 0,
      phoneLoginBusy: false,
      isCertification: false,
      checked: false,
      loginType: null,
      id: '',
      tid:'',
      uid:'',
      privacyAuthorized: false,
    };
  },
  computed: {
    ...mapState(['brandConfig']),
    activeSetting() {
      return this.brandConfig || this.setting;
    },
    displayAppName() {
      return this.activeSetting.appName || this.activeSetting.projectName || this.setting.appName;
    },
    loginLogo() {
      return this.activeSetting.logoIcon || this.activeSetting.logo || this.activeSetting.logoSquare || this.setting.logoIcon;
    },
    loginBackground() {
      return this.activeSetting.loginBackground || this.setting.loginBackground;
    },
    disabledNext() {
      return !this.form.phone || this.form.verificationCode.length !== 6;
    },
    codeButtonText() {
      return this.codeCountdown > 0 ? `${this.codeCountdown}s 后重试` : '获取验证码';
    },
  },
  onShow() {
    // 页面重新可见时刷新隐私授权状态，防止从系统设置返回后状态过时
    this.checkPrivacyAuthorization();
  },
  onLoad(e) {
    that = this;
    fastClick = true;
    that.form.phone = uni.getStorageSync('phone');
    if (e.id) {
      that.id = e.id;
    }
    if (e.loginType) {
      that.loginType = e.loginType;
      return;
    }
    if(e.tid && e.uid) {
      that.tid = e.tid;
      that.uid = e.uid;
    }
    // if (e.logout != 1) {
    //   uni.login({
    //     provider: 'weixin',
    //     success: function (loginRes) {
    //       appletsLogin({
    //         code: loginRes.code,
    //       }).then(res => {
    //         if (res.token) {
    //           that.$store.commit('setToken', res.token);
    //           that.$store.commit('setUserInfo', res);
    //           if (e && e.isCertification && !res.authentication) {
    //             uni.navigateTo({
    //               url: '/pages/user/personal/Certification',
    //             });
    //           } else {
    //             uni.reLaunch({
    //               url: '/pages/home/index',
    //             });
    //           }
    //         }
    //       });
    //     },
    //   });
    // }
    // 邀请注册进来的
    if (e && e.isCertification) {
      this.isCertification = true;
    }
    this.checkPrivacyAuthorization();
  },
  onUnload() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },
  methods: {
    checkPrivacyAuthorization() {
      // #ifdef MP-WEIXIN
      if (typeof wx !== 'undefined' && wx.getPrivacySetting) {
        wx.getPrivacySetting({
          success: res => {
            this.privacyAuthorized = !res.needAuthorization;
          },
          fail: error => {
            // 隐私状态读取失败时保持拦截，避免合规状态不明时直接进入快捷登录。
            console.warn('[login] getPrivacySetting failed:', JSON.stringify(error || {}));
            this.privacyAuthorized = false;
          },
        });
      } else {
        this.privacyAuthorized = true;
      }
      // #endif
    },
    handlePrivacyAgree() {
      this.privacyAuthorized = true;
      uni.showToast({
        title: '已同意隐私授权，请再次点击登录',
        icon: 'none',
      });
    },
    showPrivacyModal() {
      if (this.$refs.wxPrivacy) {
        this.$refs.wxPrivacy.showModal();
      } else if (typeof wx !== 'undefined' && wx.openPrivacyContract) {
        wx.openPrivacyContract({});
      }
    },
    showTost() {
      if (!this.checked) {
        uni.showToast({
          title: '请先阅读用户隐私协议',
          icon: 'none',
        });
        return;
      }
      if (!this.privacyAuthorized) {
        this.showPrivacyModal();
      }
    },
    cancelLogin() {
      // 获取当前页面栈
      const pages = getCurrentPages();

      // 如果页面栈只有一个页面，说明是通过redirectTo打开的登录页面
      if (pages.length <= 1) {
        // 直接跳转到首页
        uni.reLaunch({
          url: '/pages/home/index'
        });
      } else {
        // 正常返回上一页
        uni.navigateBack({
          delta: 1
        });
      }
    },
    getPhoneNumber(e) {
      if (e.detail.errMsg == 'getPhoneNumber:ok') {
        if (!fastClick) return;
        const phoneAuth = {
          code: e.detail.code || '',
          encryptedData: e.detail.encryptedData || '',
          iv: e.detail.iv || ''
        };
        if (!phoneAuth.code && (!phoneAuth.encryptedData || !phoneAuth.iv)) {
          showPhoneAuthDiagnostic(e.detail);
          return;
        }
        fastClick = false;
        this.phoneLoginBusy = true;
        uni.showLoading();
        uni.login({
          provider: 'weixin',
          fail() {
            fastClick = true;
            that.phoneLoginBusy = false;
            uni.hideLoading();
            showLoginError('登录失败', null, '登录凭据获取失败，请重试。');
          },
          success: function (loginRes) {
            const inviteCode = uni.getStorageSync('inviteCode')
            appletsLogin({
              code: loginRes.code,
              inviteCode: inviteCode || ''
            })
              .then(res => {
                if (res.token) {
                  uni.removeStorageSync('inviteCode')
                  that.$store.commit('setToken', res.token);
                  uni.setStorageSync('token', res.token);
                  that.$store.commit('setUserInfo', res);
                  fastClick = true;
                  that.phoneLoginBusy = false;
                  uni.hideLoading();
                  if(that.tid && that.uid) {
                      uni.redirectTo({
                         url: '/pages/user/company/authorize?tid=' + that.tid + '&uid=' + that.uid,
                      });
                      return;
                   }
                  if (that.id) {
                    uni.redirectTo({
                      url: '/pages/contract/detail/index?id=' + that.id,
                    });
                  } else {
                    if (that.isCertification && !res.authentication) {
                      uni.navigateTo({
                        url: '/pages/user/personal/Certification',
                      });
                    } else {
                      uni.reLaunch({
                        url: '/pages/home/index',
                      });
                    }
                  }
                  return;
                }
                if (!res.openId) {
                  throw new Error('登录未返回 openId，请检查后端小程序配置');
                }
                // third-login 无 token 时进入手机号绑定；return 该链路，避免授权失败被表现成无反应。
                return bind(
                  Object.assign(
                    {
                      openId: res.openId,
                      inviteCode: uni.getStorageSync('inviteCode')
                    },
                    phoneAuth
                  )
                )
                  .then(data => {
                    if (data && data.token) {
                      uni.removeStorageSync('inviteCode')
                      that.$store.commit('setToken', data.token);
                      uni.setStorageSync('token', data.token);
                      that.$store.commit('setUserInfo', data);
                      if(that.tid && that.uid) {
                        uni.redirectTo({
                          url: '/pages/user/company/authorize?tid=' + that.tid + '&uid=' + that.uid,
                        });
                        return;
                      }
                      if (that.id) {
                        uni.redirectTo({
                          url: '/pages/contract/detail/index?id=' + that.id,
                        });
                      } else {
                        if (that.isCertification && !data.authentication) {
                          uni.navigateTo({
                            url: '/pages/user/personal/Certification',
                          });
                        } else {
                          uni.reLaunch({
                            url: '/pages/home/index',
                          });
                        }
                      }
                    } else {
                      // third-bind 返回无 token 时必须显式报错，否则用户感知为"没反应"
                      showLoginError('登录失败', data, '绑定失败，请重试。');
                    }
                  })
                  .catch(error => {
                    showLoginError('手机号快捷登录失败', error, '手机号快捷登录失败，请重试。');
                  })
                  .finally(() => {
                    fastClick = true;
                    that.phoneLoginBusy = false;
                    uni.hideLoading();
                  });
              })
              .catch(error => {
                showLoginError('登录失败', error, '登录失败，请重试。');
                fastClick = true;
                that.phoneLoginBusy = false;
                uni.hideLoading();
              });
          },
        });
      } else if (e.detail && e.detail.errMsg) {
        this.phoneLoginBusy = false;
        if (!this.privacyAuthorized) {
          this.showPrivacyModal();
          return;
        }
        showPhoneAuthDiagnostic(e.detail);
      } else {
        this.phoneLoginBusy = false;
        showPhoneAuthDiagnostic(e && e.detail);
      }
    },
    refreshHumanCheck() {
      if (!reg.phone.test(that.form.phone)) {
        that.common.showToast('请先输入正确手机号');
        return Promise.resolve();
      }
      return getSmsLoginChallenge(that.form.phone).then(data => {
        that.humanCheck = {
          phone: that.form.phone,
          question: data.question,
          token: data.challengeToken,
          answer: '',
        };
      });
    },
    getCode() {
      if (this.disabled) return;

      if (!that.form.phone.trim()) {
        that.common.showToast('手机号获取失败');
        return;
      }
      if (!reg.phone.test(that.form.phone)) {
        that.common.showToast('手机号格式有误');
        return;
      }
      if (!that.humanCheck.token || that.humanCheck.phone !== that.form.phone) {
        that.refreshHumanCheck();
        that.common.showToast('请先完成安全校验');
        return;
      }
      if (!that.humanCheck.answer.trim()) {
        that.common.showToast('请输入安全校验答案');
        return;
      }
      that.disabled = true;
      that.codeCountdown = 0;
      getCode({
        phone: that.form.phone,
        type: 1,
        challengeToken: that.humanCheck.token,
        challengeAnswer: that.humanCheck.answer,
      })
        .then(res => {
          that.humanCheck.token = '';
          that.humanCheck.answer = '';
          that.codeCountdown = 60;
          timer = setInterval(() => {
            if (that.codeCountdown > 1) {
              that.codeCountdown -= 1;
            } else {
              clearInterval(timer);
              timer = null;
              that.codeCountdown = 0;
              that.disabled = false;
            }
          }, 1000);
        })
        .catch(() => {
          that.disabled = false;
          that.codeCountdown = 0;
          that.refreshHumanCheck();
        });
    },
    submit() {
      if (!this.checked) {
        this.showTost();
        return;
      }
      if (this.disabledNext) return;
      if (!that.form.phone.trim()) {
        that.common.showToast('手机号不能为空');
        return;
      }
      if (!reg.phone.test(that.form.phone)) {
        that.common.showToast('手机号格式有误');
        return;
      }

      // 2验证码登录
      if (!that.form.verificationCode.trim()) {
        that.common.showToast('请输入验证码');
        return;
      }

      uni.showLoading();
      const inviteCode = uni.getStorageSync('inviteCode')
      loginBySms({
        ...that.form,
        inviteCode: inviteCode || ''
      }).then(data => {
        uni.hideLoading();
        if (data.token) {
          uni.removeStorageSync('inviteCode')
          uni.setStorageSync('phone', that.form.phone);
          that.$store.commit('setToken', data.token);
          uni.setStorageSync('token', data.token);
          that.$store.commit('setUserInfo', data);

          if(that.tid && that.uid) {
             uni.redirectTo({
               url: '/pages/user/company/authorize?tid=' + that.tid + '&uid=' + that.uid,
              });
              return;
           }

          if (that.id) {
            uni.redirectTo({
              url: '/pages/contract/detail/index?id=' + that.id,
            });
          } else {
            uni.reLaunch({
              url: '/pages/home/index',
            });
          }
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #EAF2FF;

  .login-hero {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 620rpx;
    z-index: 1;
    overflow: hidden;
    background:
      radial-gradient(circle at 84% 18%, rgba(111, 218, 255, 0.8) 0, rgba(111, 218, 255, 0) 210rpx),
      linear-gradient(145deg, #064BC4 0%, #137DFF 56%, #45C5F4 100%);
  }

  .bg-image {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.18;
    z-index: 1;
  }

  .hero-mask {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 260rpx;
    z-index: 2;
    background: linear-gradient(180deg, rgba(234, 242, 255, 0) 0%, #EAF2FF 92%);
  }

  .brand-panel {
    position: absolute;
    top: 132rpx;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 60rpx;
  }

  .brand-logo {
    width: 124rpx;
    height: 124rpx;
    padding: 20rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 22rpx 48rpx rgba(0, 48, 132, 0.22);
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .brand-logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1677FF;
    font-size: 56rpx;
    font-weight: 700;
    width: 100%;
    height: 100%;
    line-height: 1;
  }

  .brand-logo-image {
    position: absolute;
    top: 20rpx;
    left: 20rpx;
    width: 84rpx;
    height: 84rpx;
    z-index: 2;
  }

  .brand-name {
    margin-top: 22rpx;
    color: #FFFFFF;
    font-size: 46rpx;
    font-weight: 600;
    line-height: 1.2;
    text-shadow: 0 4rpx 14rpx rgba(0, 44, 120, 0.32);
  }

  .brand-desc {
    margin-top: 16rpx;
    padding: 8rpx 22rpx;
    color: rgba(255, 255, 255, 0.94);
    font-size: 26rpx;
    line-height: 1.4;
    border-radius: 999rpx;
    background: rgba(0, 39, 118, 0.16);
  }

  .bottom-modal {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    min-height: 500rpx;
    max-height: 78vh;
    overflow-y: auto;
    background-color: #FFFFFF;
    border-radius: 40rpx 40rpx 0 0;
    padding: 46rpx 48rpx 34rpx;
    box-sizing: border-box;
    z-index: 4;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -18rpx 44rpx rgba(20, 64, 128, 0.08);

    .auth-copy {
      display: flex;
      flex-direction: column;
      margin-bottom: 34rpx;
    }

    .auth-title {
      color: #1B2B46;
      font-size: 34rpx;
      font-weight: 600;
      line-height: 1.35;
    }

    .auth-desc {
      margin-top: 10rpx;
      color: #6B7A90;
      font-size: 24rpx;
      line-height: 1.45;
    }

    .h5-login-form {
      margin-top: 28rpx;
      display: flex;
      flex-direction: column;
      gap: 22rpx;
    }

    .h5-login-input {
      box-sizing: border-box;
      height: 88rpx;
      padding: 0 28rpx;
      border: 1px solid #DCE5F2;
      border-radius: 20rpx;
      color: #1B2B46;
      font-size: 28rpx;
      background: #F8FAFF;
    }

    .h5-code-row {
      display: flex;
      align-items: center;
      gap: 18rpx;
    }

    .h5-human-row {
      display: flex;
      align-items: center;
      gap: 18rpx;
    }

    .h5-human-question {
      flex: 1;
      height: 88rpx;
      line-height: 88rpx;
      padding: 0 28rpx;
      border: 1px solid #DCE5F2;
      border-radius: 20rpx;
      color: #1B2B46;
      font-size: 28rpx;
      background: #F8FAFF;
      box-sizing: border-box;
    }

    .h5-human-input {
      width: 160rpx;
      flex: none;
      text-align: center;
    }

    .h5-code-input {
      flex: 1;
    }

    .btn-code {
      width: 236rpx;
      height: 88rpx;
      line-height: 88rpx;
      border: 1px solid #317CFF;
      border-radius: 20rpx;
      color: #317CFF;
      background: #FFFFFF;
      font-size: 26rpx;
      text-align: center;
      padding: 0;
      white-space: nowrap;
    }

    .btn-code-text {
      display: block;
      width: 100%;
      color: inherit;
      font-size: 24rpx;
      line-height: 88rpx;
      white-space: nowrap;
    }

    .btn-login {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      margin-left: 0;
      margin-right: 0;
      margin-top: 36rpx;
      height: 88rpx;
      line-height: normal;
      background-color: #317CFF;
      border-radius: 20rpx;
      color: #FFFFFF;
      font-size: 28rpx;
      font-weight: 500;
      border: none;
      text-align: center;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }

    .btn-login[disabled] {
      opacity: 0.55;
    }

    .btn-code[disabled] {
      opacity: 1;
      color: #7897C6;
      border-color: #C8D6EA;
      background: #F4F7FC;
    }

    .btn-cancel {
      width: 100%;
      box-sizing: border-box;
      margin-top: 30rpx;
      height: 88rpx;
      line-height: normal;
      border: 1px solid #E7E7E7;
      border-radius: 20rpx;
      color: #353D4B;
      font-size: 28rpx;
      font-weight: 500;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
  }
}
</style>
