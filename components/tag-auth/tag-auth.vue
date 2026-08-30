<!--
 * @Author: wudi
 * @Date: 2023-08-29 09:44:38
 * @LastEditors: wudi
 * @LastEditTime: 2023-12-12 16:42:50
 * @Description:
-->
<template>
  <view v-if="userInfo">
    <!-- 企业身份 -->
    <template v-if="userInfo.companyId">
      <view v-if="userInfo.companyName" class="tag-auth tag-auth__enterauth flex-ct text-20">
        企业认证
      </view>
      <view v-else class="tag-auth tag-auth__unauth flex-ct text-20">
        <image class="icon-auth" src="@/static/IconEnterpriseUnAuth.png"></image>
        未认证
      </view>
    </template>
    <!-- 个人身份 -->
    <template v-else>
      <view v-if="userInfo.authentication" class="tag-auth tag-auth__auth flex-ct text-20">
        个人认证
      </view>
      <view
        v-else
        class="tag-auth tag-auth__unauth flex-ct text-20"
        @click="
          userInfo.witnessComparison
            ? common.navigateTo('/pages/user/personal/CertificationThree?originType=mine')
            : common.navigateTo('/pages/user/personal/Certification?originType=mine')
        "
      >
        <image class="icon-auth" src="@/static/IconUserUnAuth.png"></image>
        未实名
      </view>
    </template>
  </view>
</template>

<script>
export default {
  name: 'tag-auth',
  props: {
    userInfo: {
      default: '',
      type: Object,
    },
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
.tag-auth {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 14rpx;
  line-height: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.icon-auth {
  margin-right: 4rpx;
  width: 24rpx;
  height: 24rpx;
}

.tag-auth__unauth {
  color: #999999;
  background: rgba(#999999, 0.1);
  border: 1px solid rgba(#999999, 0.2);
  
  &:active {
    background: rgba(#999999, 0.15);
  }
}

.tag-auth__auth {
  color: $uni-color-primary;
  background: rgba($uni-color-primary, 0.08);
  border: 1px solid rgba($uni-color-primary, 0.15);
}

.tag-auth__enterauth {
  color: $uni-color-minor;
  background: rgba($uni-color-minor, 0.08);
  border: 1px solid rgba($uni-color-minor, 0.15);
}
</style>
