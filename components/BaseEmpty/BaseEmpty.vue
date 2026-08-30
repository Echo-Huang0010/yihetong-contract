<!--
 * @Description:
 * @LastEditTime: 2023-09-20 10:30:14
 * @LastEditors: wudi
 * @Author: 刘仁秀
 * @Date: 2022-09-05 16:57:04
-->
<template>
  <view class="container">
    <image class="img-empty" src="@/static/ImgEmpty.png" />
    <view class="massage" v-html="massage" />
    <slot v-if="$slots.default"></slot>
  </view>
</template>

<script>
export default {
  props: {
    massage: {
      type: String,
      default: '',
    }
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 0;
  animation: fadeIn 0.5s ease-in-out;

  .img-empty {
    width: 300rpx;
    height: 300rpx;
    transition: all 0.3s;
    opacity: 0.8;
    
    &:hover {
      transform: scale(1.05);
    }
  }

  .massage {
    margin-top: 20rpx;
    font-size: 28rpx;
    font-family: PingFang SC-Regular, PingFang SC;
    color: #999999;
    line-height: 46rpx;
    text-align: center;
    padding: 10rpx 30rpx;
    border-radius: 30rpx;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
