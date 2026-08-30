<template>
  <uni-popup ref="popupRef" type="bottom" :safe-area="false">
    <view class="color-box">
      <view class="flex-sb">
        <view class="text-32 bold">选择颜色</view>
        <uni-icons type="closeempty" size="22" color="#666666"></uni-icons>
      </view>
      <view class="list">
        <view
          class="flex-sb item"
          :class="{ active: item === value }"
          v-for="(item, i) in list"
          :key="i"
          @click="value = item"
        >
          <view :style="{ background: item }" class="color"></view>
          <view class="flex-ct cur">
            <uni-icons type="checkmarkempty" color="#FF6565" size="15"></uni-icons>
            <text>当前使用</text>
          </view>
        </view>
      </view>
      <button
        type="primary"
        @click="
          $refs.popupRef.close();
          $emit('change', value);
        "
      >
        确定
      </button>
    </view>
  </uni-popup>
</template>

<script>
export default {
  props: {},
  data() {
    return {
      value: '#ff0000',
      list: ['#ff0000', '#0000ff', '#000000'],
    };
  },
  methods: {
    show(color) {
      this.value = color || this.list[0];
      this.$refs.popupRef.open();
    },
  },
};
</script>

<style lang="scss" scoped>
.color-box {
  padding: 32rpx;
  background: white;
  padding-bottom: calc(constant(safe-area-inset-bottom) + 32rpx);
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
  .text-32 {
    text-align: center;
    flex: 1;
    padding-left: 22px;
  }
  .list {
    display: flex;
    justify-content: space-between;
    padding: 60rpx 0;
    .item {
      width: 166rpx;
      height: 88rpx;
      position: relative;
      border-radius: 4rpx;
      .color {
        width: 100%;
        height: 100%;
      }
      .cur {
        display: none;
        position: absolute;
        width: 100%;
        left: 0;
        bottom: 0;
        height: 40rpx;
        background: #ebf1ff;
        text {
          color: $uni-color-primary;
          font-weight: bold;
          font-size: 22rpx;
          padding-left: 2rpx;
        }
      }
      &.active {
        border: 1px solid $uni-color-primary;
        .cur {
          display: flex;
        }
      }
    }
  }
}
</style>
