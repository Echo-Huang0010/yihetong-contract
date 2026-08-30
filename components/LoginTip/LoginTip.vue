<template>
  <view v-if="show">
    <view class="outer-box" v-if="userInfo">
      <view class="unAuth flex-sb flex-1" v-if="!userInfo.authentication">
        <text class="text-28 color-base">
          您还未认证，实名认证后即可
          <text class="bold color-primary">{{ authGiftText }}</text>
        </text>
        <navigator url="/pages/user/personal/Certification" hover-class="none" class="login-btn">
          去认证
        </navigator>
      </view>
      <view class="contract-info" v-else @click="$refs.checkUserRef.open()">
        <view class="user-name">
          {{
            Number(userInfo.identityType) === 1
              ? userInfo.companyName
              : userInfo.nickname || userInfo.phone
          }}
        </view>
        <view class="count-info">
          （剩余{{
            Number(userInfo.identityType) === 1
              ? userInfo.companyMealCount || 0
              : userInfo.individualMealCount || 0
          }}份）
        </view>
        <image class="icon-arrow" src="/static/ic_arrow.svg" />
      </view>
      <checkUser ref="checkUserRef" :check="false" backType="mine" />
    </view>
    <view class="outer-box" v-else>
      <view>您还未登录，登录后即可使用完整功能。</view>
      <navigator url="/pages/login/login" hover-class="none" class="login-btn">立即登录</navigator>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';
export default {
  name: 'LoginTip',
  computed: {
    ...mapState(['userInfo', 'brandConfig']),
    authGiftText() {
      const count = Number(
        this.brandConfig && this.brandConfig.personalRegisterGiftContractCount
      );
      if (Number.isFinite(count) && count > 0) {
        return `获赠${count}份合同`;
      }
      return '使用完整功能';
    },
  },
  data() {
    return {
      show: false,
    };
  },
  created() {
    setTimeout(() => {
      this.show = true;
    }, 88);
  },
};
</script>

<style lang="scss" scoped>
.outer-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #343434;
  width: 100%;
  z-index: 1;
  
  .unAuth {
    background: #f6f9ff;
    padding: 24rpx 32rpx;
  }
  
  .login-btn {
    border-radius: 26rpx;
    padding: 12rpx 16rpx;
    min-width: 100rpx;
    font-size: 24rpx;
    text-align: center;
    color: #ffffff;
    background: linear-gradient(292deg, #2868df 0%, #649aff 100%, rgba(52, 120, 247, 0) 100%);
    box-shadow: 0px 4rpx 12rpx 0px rgba(52, 120, 247, 0.24);
  }
  
  .contract-info {
    display: flex;
    align-items: center;
    height: 88rpx;
    background-color: #EAF2FF;
    padding: 0 30rpx;
    position: relative;
    width: 100%;
    
    .user-name {
      font-size: 30rpx;
      color: #353D4B;
      margin-right: 20rpx;
    }
    
    .count-info {
      font-size: 20rpx;
      color: #6E7C93;
    }
    
    .icon-arrow {
      width: 24rpx;
      height: 24rpx;
      position: absolute;
      right: 30rpx;
    }
  }
}
</style>
