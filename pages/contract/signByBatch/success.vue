<template>
  <view class="flex-col page">
    <image src="@/static/success.png"></image>
    <view class="text-lg">已完成签署</view>
    <view class="text-sm">
      您已成功完成
      <text>{{ count }}</text>
      份合同签署
    </view>
    <navigator url="/pages/home/index" open-type="switchTab" hover-class="none">
      <button type="primary">回到首页</button>
    </navigator>
  </view>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
    };
  },
  onLoad(e) {
    this.count = e.count || 0;
  },
};
</script>

<style lang="scss" scoped>
.page {
  padding: 168rpx 30rpx;
  image {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 50rpx;
  }
  .text-lg {
    font-weight: bold;
    font-size: 38rpx;
    margin-bottom: 20rpx;
  }
  .text-sm {
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 160rpx;
    text {
      color: #ff0000;
      font-size: 30rpx;
    }
  }
  button,
  navigator {
    line-height: 88rpx;
    width: 100%;
  }
}
</style>
