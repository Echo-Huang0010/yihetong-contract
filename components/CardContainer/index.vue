<template>
  <view 
    class="card-container" 
    :class="[
      shadow ? 'with-shadow' : '',
      round ? 'round-corners' : '',
      padding ? 'with-padding' : 'no-padding',
      { 'card-hover': hover }
    ]"
    :style="style"
  >
    <view v-if="title" class="card-title">
      <view class="title-indicator" v-if="showIndicator"></view>
      <text>{{ title }}</text>
      <slot name="title-extra"></slot>
    </view>
    <view class="card-content" :class="{ 'has-title': title }">
      <slot></slot>
    </view>
    <view v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CardContainer',
  props: {
    title: {
      type: String,
      default: ''
    },
    shadow: {
      type: Boolean,
      default: true
    },
    round: {
      type: Boolean,
      default: false
    },
    padding: {
      type: Boolean,
      default: true
    },
    hover: {
      type: Boolean,
      default: false
    },
    showIndicator: {
      type: Boolean,
      default: true
    },
    style: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.card-container {
  width: 100%;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
  overflow: hidden;
  transition: all 0.3s;
  
  &.with-shadow {
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  }
  
  &.round-corners {
    border-radius: 24rpx;
  }
  
  &.with-padding {
    padding: 32rpx;
  }
  
  &.no-padding {
    padding: 0;
    
    .card-title {
      padding: 24rpx 32rpx;
    }
    
    .card-content.has-title {
      padding: 0 32rpx 32rpx;
    }
  }
  
  &.card-hover:active {
    transform: translateY(2rpx);
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
  }
  
  .card-title {
    display: flex;
    align-items: center;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 24rpx;
    position: relative;
    
    .title-indicator {
      width: 6rpx;
      height: 30rpx;
      background: $uni-color-primary;
      border-radius: 3rpx;
      margin-right: 16rpx;
    }
  }
  
  .card-content {
    width: 100%;
    
    &.has-title {
      // 这里可以根据需要添加额外样式
    }
  }
  
  .card-footer {
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 1px solid rgba($uni-color-primary, 0.1);
  }
}
</style> 