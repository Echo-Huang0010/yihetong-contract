<template>
  <view class="page-base" style="background-color: #F3F3F3;">
    <!-- 顶部购买信息 -->
    <view class="top-card">
      <view class="top-bg">
        <image src="https://resource.yi-types.com/new-sign/bg_buy_top.webp" class="bg-image" mode="widthFix" />
          <!-- Logo和标题 -->
          <view class="logo-section">
            <view class="logo-box">
          <image class="logo" :src="setting.logoWhite" mode="aspectFit"></image>
          <text class="app-title">{{ setting.appName }}</text>
        </view>
        </view>
        <view class="service-type">
          <image :src="form.type === 1 ? '/static/ic_buy_company.svg' : '/static/ic_buy_person.svg'" class="service-icon" />
          {{ form.type === 1 ? '企业电子签服务' : '个人电子签服务' }}
        </view>
        <view class="validity-tag">有效期{{ periodDefault }}月</view>
      </view>

      <!-- 企业信息，仅企业版显示 -->
      <view v-if="form.type == 1" class="form-item">
        <view class="item-label">
          <view class="label-line"></view>
          <text class="label-text">购买企业</text>
        </view>
        <view class="company-name">{{ userInfo.companyName || '请添加企业' }}</view>
      </view>

      <view class="form-item">
        <view class="item-label">
          <view class="label-line"></view>
          <text class="label-text">购买份数</text>
        </view>
        <view class="input-box">
          <input
            :value="form.share"
            @input="change(modify, $event)"
            class="share-input"
            type="number"
            maxlength="4"
            placeholder="请输入购买份数"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <view class="form-item">
        <view class="item-label">
          <view class="label-line"></view>
          <text class="label-text">购买套餐</text>
        </view>
        <view class="package-options">
          <view
            v-for="(item, idx) in packageOptions"
            :key="idx"
            class="package-item"
            :class="{ 'selected': form.share === item.value }"
            @click="selectPackage(item.value)"
          >
            {{ item.label }}
            <image v-if="form.share === item.value" src="https://resource.yi-types.com/new-sign/ic_bug_checked.webp" class="check-icon" />
          </view>
        </view>
        <view class="more-options" @click="openCustomerService">更多优惠套餐请联系平台</view>
      </view>
    </view>

    <!-- 中间购买须知 -->
    <view class="notice-card">
      <view class="item-label">
        <view class="label-line"></view>
        <text class="label-text">购买须知</text>
      </view>
      <view class="notice-content">
        <view class="notice-item">1.套餐购买完成后立即生效，且不可退款。</view>
        <view class="notice-item">2.购买完成的套餐仅限本人使用，不支持转让、赠送或其他交易。</view>
        <view class="notice-item">3.套餐应在有效期内使用，到期自动失效，不退不补，请尽早使用。</view>
        <view class="notice-item">4.发起者是个人购买个体套餐，发起者是企业购买企业套餐。</view>
        <view class="notice-item">5.发起签署合同即会消耗套餐份数。</view>
      </view>
    </view>

    <!-- 底部支付信息 -->
    <view class="footer-card">
      <view class="pay-info">
        <text class="pay-label">支付金额：</text>
        <text class="pay-symbol">¥</text>
        <text class="pay-amount">{{ (form.price * form.share) | money }}</text>
      </view>
      <view class="pay-btn" @click="submit">立即购买</view>
    </view>

    <view class="service-dialog-mask" v-if="showCustomerService" @click="hideCustomerService">
      <view class="service-dialog-container" @click.stop>
        <image class="dialog-bg" src="/static/bg_service_dialog.svg" mode="aspectFit" />
        <view class="dialog-content">
          <view class="circle-avatar">
            <image class="robot-avatar" src="/static/ic_service_dialog_robot.svg" mode="aspectFit" />
          </view>
          <text class="dialog-title">专属企业服务小助手</text>
          <text class="dialog-subtitle">更多优惠套餐请联系客服</text>
          <image
            v-if="customerServiceQrCode"
            class="qrcode-image"
            show-menu-by-longpress
            :src="customerServiceQrCode"
            mode="aspectFit"
          />
          <view v-else class="service-contact-fallback">
            <text v-for="item in customerServiceContacts" :key="item">{{ item }}</text>
          </view>
          <text class="qrcode-tip">{{ customerServiceQrCode ? '长按或扫码联系客服' : '请按上述方式联系客服' }}</text>
        </view>
        <image class="close-button" src="/static/ic_dialog_close.svg" mode="aspectFit" @click="hideCustomerService" />
      </view>
    </view>
  </view>
</template>

<script>
var that, fastClick;
import { pay, meallist, reconcilePaidOrder } from '@/api/seal.js';
import { appletsLogin } from '@/api/login.js';
import { mapState } from 'vuex';
import setting from '@/config/setting.js';
export default {
  data() {
    return {
      setting,
      form: {
        id: '', // 套餐id
        type: 0, // 套餐类型 0个人套餐,1企业套餐
        price: 0, // 单价
        share: 1, // 购买份数
      },
      mealList: [],
      packageOptions: [
        { label: '5份', value: 5 },
        { label: '50份', value: 50 },
        { label: '100份', value: 100 },
        { label: '500份', value: 500 },
      ],
      showCustomerService: false
    };
  },
  computed: {
    ...mapState(['userInfo', 'brandConfig']),
    activeSetting() {
      return this.brandConfig || setting;
    },
    customerServiceQrCode() {
      return String(this.activeSetting.customerServiceQrCode || '').trim();
    },
    customerServiceContacts() {
      const contacts = [];
      const phone = String(this.activeSetting.telphone || '').trim();
      const weixin = String(this.activeSetting.weixin || '').trim();
      if (phone) contacts.push(`客服电话：${phone}`);
      if (weixin) contacts.push(`客服微信：${weixin}`);
      return contacts.length ? contacts : ['客服信息暂未配置，请联系平台管理员'];
    },
    periodDefault() {
      // 上链的默认12个月，非上链的默认36个月
      return this.userInfo.batchSignPlan == 1 ? 36 : 12;
    },
  },
  onLoad(e) {
    console.log('buy', e);
    that = this;
    fastClick = true;

    // 解析参数
    let type = 0;
    let quantity = 0;

    // 如果e.q存在，说明是通过扫码进入，需要从完整URL中解析参数
    if (e.q) {
      try {
        // 对URL进行解码
        const decodedUrl = decodeURIComponent(e.q);
        console.log('解码后的URL:', decodedUrl);

        // 解析URL中的参数 - 使用更兼容的方式
        const queryString = decodedUrl.split('?')[1];
        if(queryString) {
          const params = queryString.split('&');

          params.forEach(param => {
            const [key, value] = param.split('=');
            if(key === 'type') {
              type = parseInt(value) || 0;
            } else if(key === 'quantity') {
              quantity = parseInt(value) || 0;
            }
          });
        }

        console.log('解析参数: type=', type, 'quantity=', quantity);
      } catch (error) {
        console.error('URL解析错误:', error);
      }
    } else {
      // 直接从页面参数获取
      type = parseInt(e.type) || 0;
      quantity = parseInt(e.quantity) || 0;
    }

    meallist().then(response => {
      let res = response || [];
      const findList = res.find(i => i.type === type);
      res = findList ? [findList] : [];
      this.mealList = res;
      if (res.length) {
        this.form.id = res[0].id;
        this.form.price = res[0].price;
        this.form.type = res[0].type;
        // 如果有quantity参数，则使用参数值，否则根据类型设置默认值
        this.form.share = quantity > 0 ? quantity : (type === 0 ? 1 : 10);
      }
    });
  },
  methods: {
    async confirmPaymentArrival(outTradeNo) {
      if (!outTradeNo) return false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        try {
          if (await reconcilePaidOrder(outTradeNo)) {
            return true;
          }
        } catch (error) {
          // The verified WeChat callback remains authoritative. A temporary
          // query failure must not turn a completed payment into a UI failure.
        }
      }
      return false;
    },
    openCustomerService() {
      this.showCustomerService = true;
    },
    hideCustomerService() {
      this.showCustomerService = false;
    },
    selectPackage(value) {
      this.form.share = value;
    },
    tab(item) {
      // if (item.type == 0) this.form.share = 1;
      // if (item.type == 1) this.form.share = 10;
      // this.form.id = item.id;
      // this.form.type = item.type;
      // this.form.price = item.price;
    },
    change(arithmetic, e) {
      switch (this.form.type) {
        case 0: {
          this.form.share = arithmetic(this.form.share, 1, e);
          break;
        }
        case 1: {
          this.form.share = arithmetic(this.form.share, 10, e);
          break;
        }
      }
    },
    modify(origin, _, e) {
      return Number(e.detail.value || 0);
    },
    add(origin, number) {
      if (origin + number > 9999) {
        return origin;
      }
      return (origin += number);
    },
    subtract(origin, number) {
      if (origin - number < 0) {
        return origin;
      }
      return (origin -= number);
    },
    submit() {
      // #ifdef MP-WEIXIN
      if (!this.userInfo || !this.userInfo.openId) {
        uni.showModal({
          title: '需要绑定微信',
          content: '当前登录未绑定微信身份，无法发起微信支付。请返回登录页完成手机号快捷登录。',
          confirmText: '去登录',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          },
        });
        return;
      }
      // #endif

      if (this.form.type == 1 && !this.userInfo.companyId) {
        uni.showModal({
          content: '企业认证后才可购买企业套餐！',
          confirmText: '去认证',
          confirmColor: '#4A8DFF',
          success: function (res) {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/user/company/Certification',
              });
            }
          },
        });
        return;
      }
      if (!fastClick) return;
      fastClick = false;
      // #ifndef MP
      uni.showToast({
        title: '终端不支持支付',
        icon: 'none',
      });
      fastClick = true;
      return;
      // #endif
      pay({
        id: this.form.id,
        share: this.form.share,
      })
        .then(res => {
          console.log(res);
          // #ifdef MP
          uni.getProvider({
            service: 'oauth',
            success: function (resp) {
              if (resp.provider) {
                wx.requestPayment({
                  provider: resp.provider[0],
                  appId: res.result.appId,
                  timeStamp: res.result.timeStamp,
                  nonceStr: res.result.nonceStr,
                  package: res.result.packageValue,
                  signType: res.result.signType,
                  paySign: res.result.paySign,
                  success: async function () {
                    const arrived = await that.confirmPaymentArrival(res.outTradeNo);
                    if (!arrived) {
                      uni.showToast({
                        title: '支付成功，套餐正在到账，请稍后刷新',
                        icon: 'none',
                        duration: 2200,
                      });
                    }
                    uni.navigateBack();
                  },
                  fail: function (err) {
                    fastClick = true;
                    console.log('fail:' + JSON.stringify(err));
                  },
                });
              } else {
                fastClick = true;
              }
            },
            fail() {
              fastClick = true;
            },
          });
          // #endif
        })
        .catch(() => {
          fastClick = true;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.page-base {
  min-height: 100vh;
  padding: 0 30rpx;
  box-sizing: border-box;
}

.top-card {
  margin: 30rpx 0;
  background: #FFFFFF;
  border-radius: 30rpx;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.top-bg {
  position: relative;
  width: 100%;
}

.bg-image {
  width: 100%;
  vertical-align: middle;
  display: block;
}

.logo-section {
  position: absolute;
  top: 40rpx;
  left: 40rpx;

  z-index: 2;

  .logo-box {
    position: relative;
     display: flex;
  flex-direction: row;
  align-items: center;

  }

  .logo {
    width: 56rpx;
      height: 56rpx;
    }

    .app-title {
      margin-left: 24rpx;
      color: #FFFFFF;
      font-size: 30rpx;
    }
  }


.service-type {
  position: absolute;
  bottom: 40rpx;
  left: 40rpx;
  font-size: 40rpx;
  color: #FFFFFF;
  z-index: 1;
  display: flex;
  align-items: center;
}

.service-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

.validity-tag {
  position: absolute;
  bottom: 40rpx;
  right: 40rpx;
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 18rpx;
  background: #FFFFFF;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #4A8DFF;
  z-index: 1;
}

.form-item {
  margin-top: 40rpx;
  padding: 0 30rpx;
  padding-bottom: 30rpx;
}

.item-label {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.label-line {
  width: 6rpx;
  height: 30rpx;
  background: #4A8DFF;
  border-radius: 3rpx;
}

.label-text {
  margin-left: 8rpx;
  font-size: 30rpx;
  color: #353D4B;
  font-weight: bold;
}

.input-box {
  height: 88rpx;
  border: 1rpx solid #E7E7E7;
  border-radius: 30rpx;
}

.share-input {
  height: 100%;
  width: 100%;
  padding: 0 30rpx;
  font-size: 26rpx;
}

.placeholder {
  color: #6E7C93;
  font-size: 26rpx;
}

.package-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.package-item {
  position: relative;
  width: calc(50% - 9rpx);
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  margin-bottom: 18rpx;
  border: 2rpx solid #E7E7E7;
  border-radius: 30rpx;
  box-sizing: border-box;
}

.package-item.selected {
  background-color: #F5FBFF;
  border: 4rpx solid #4A8DFF;
}

.check-icon {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 64rpx;
  height: 64rpx;
}

.more-options {
  margin-top: 30rpx;
  text-align: center;
  font-size: 26rpx;
  color: #4A8DFF;
  text-decoration: underline;
  padding: 8rpx 0;
}

.notice-card {
  margin: 30rpx 0;
  padding: 30rpx;
  background: #FFFFFF;
  border-radius: 30rpx;
}

.notice-content {
  margin-top: 26rpx;
}

.notice-item {
  font-size: 24rpx;
  color: #353D4B;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.footer-card {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100rpx;
  padding: 0 30rpx;
  background: #FFFFFF;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
}

.pay-info {
  display: flex;
  align-items: baseline;
}

.pay-label {
  font-size: 22rpx;
  color: #353D4B;
}

.pay-symbol {
  font-size: 28rpx;
  color: #4A8DFF;
}

.pay-amount {
  font-size: 48rpx;
  color: #4A8DFF;
  font-weight: bold;
}

.pay-btn {
  width: 372rpx;
  height: 76rpx;
  line-height: 76rpx;
  background: #4A8DFF;
  border-radius: 30rpx;
  text-align: center;
  font-size: 28rpx;
  color: #FFFFFF;
}

.company-name {
  font-size: 30rpx;
  color: #353D4B;
  padding: 10rpx 0;
}

.service-dialog-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-dialog-container {
  position: relative;
  width: 630rpx;
  min-height: 760rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dialog-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.dialog-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10rpx;
}

.circle-avatar {
  width: 190rpx;
  height: 190rpx;
  background-color: #317CFF;
  border-radius: 95rpx;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.robot-avatar {
  width: 148rpx;
  height: 160rpx;
}

.dialog-title {
  margin-top: 34rpx;
  font-size: 30rpx;
  color: #353D4B;
}

.dialog-subtitle {
  margin-top: 14rpx;
  font-size: 28rpx;
  color: #353D4B;
}

.qrcode-image {
  margin-top: 18rpx;
  width: 428rpx;
  height: 428rpx;
}

.service-contact-fallback {
  width: 428rpx;
  min-height: 180rpx;
  margin-top: 58rpx;
  padding: 36rpx 28rpx;
  box-sizing: border-box;
  border-radius: 22rpx;
  background: rgba(49, 124, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
}

.service-contact-fallback text {
  max-width: 100%;
  font-size: 28rpx;
  line-height: 1.5;
  color: #353D4B;
  text-align: center;
  word-break: break-all;
}

.qrcode-tip {
  margin-top: 32rpx;
  font-size: 30rpx;
  color: #353D4B;
}

.close-button {
  width: 62rpx;
  height: 62rpx;
  margin-top: 64rpx;
}
</style>
