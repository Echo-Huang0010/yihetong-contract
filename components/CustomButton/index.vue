<template>
  <button 
    class="custom-button" 
    :class="[
      type, 
      size, 
      shape,
      {
        'disabled': disabled,
        'loading': loading,
        'block': block,
        'icon-only': !$slots.default && $slots.icon
      }
    ]" 
    :disabled="disabled || loading" 
    @click="handleClick"
  >
    <view v-if="loading" class="loading-icon">
      <view class="loading-circular"></view>
    </view>
    <view v-else-if="$slots.icon" class="button-icon">
      <slot name="icon"></slot>
    </view>
    <view v-if="$slots.default" class="button-text" :class="{'with-icon': $slots.icon}">
      <slot></slot>
    </view>
  </button>
</template>

<script>
export default {
  name: 'CustomButton',
  props: {
    type: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'secondary', 'outline', 'text', 'success', 'warning', 'error'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    shape: {
      type: String,
      default: 'normal',
      validator: value => ['normal', 'round', 'circle'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    block: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick(e) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', e);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  transition: all 0.3s;
  box-sizing: border-box;
  line-height: 1;
  position: relative;
  overflow: hidden;
  border: none;
  padding: 0 36rpx;
  
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
  }
  
  &:active::after {
    width: 300%;
    height: 300%;
    opacity: 1;
    transition: all 0.5s;
  }
  
  // 类型
  &.primary {
    background: linear-gradient(to right, $uni-color-primary, darken($uni-color-primary, 10%));
    color: #fff;
    box-shadow: 0 6rpx 12rpx rgba($uni-color-primary, 0.2);
    
    &:active {
      transform: translateY(2rpx);
      box-shadow: 0 2rpx 8rpx rgba($uni-color-primary, 0.15);
    }
  }
  
  &.secondary {
    background: rgba($uni-color-primary, 0.1);
    color: $uni-color-primary;
    
    &:active {
      background: rgba($uni-color-primary, 0.2);
    }
  }
  
  &.outline {
    background: transparent;
    border: 1px solid $uni-color-primary;
    color: $uni-color-primary;
    
    &:active {
      background: rgba($uni-color-primary, 0.05);
    }
  }
  
  &.text {
    background: transparent;
    color: $uni-color-primary;
    box-shadow: none;
    
    &:active {
      opacity: 0.7;
    }
  }
  
  &.success {
    background: linear-gradient(to right, $uni-color-success, darken($uni-color-success, 10%));
    color: #fff;
    box-shadow: 0 6rpx 12rpx rgba($uni-color-success, 0.2);
  }
  
  &.warning {
    background: linear-gradient(to right, $uni-color-warning, darken($uni-color-warning, 10%));
    color: #fff;
    box-shadow: 0 6rpx 12rpx rgba($uni-color-warning, 0.2);
  }
  
  &.error {
    background: linear-gradient(to right, $uni-color-error, darken($uni-color-error, 10%));
    color: #fff;
    box-shadow: 0 6rpx 12rpx rgba($uni-color-error, 0.2);
  }
  
  // 大小
  &.small {
    height: 64rpx;
    font-size: 24rpx;
  }
  
  &.medium {
    height: 88rpx;
  }
  
  &.large {
    height: 96rpx;
    font-size: 32rpx;
    font-weight: bold;
  }
  
  // 形状
  &.round {
    border-radius: 44rpx;
  }
  
  &.circle {
    border-radius: 50%;
    padding: 0;
    width: 80rpx;
    height: 80rpx;
    &.small {
      width: 64rpx;
      height: 64rpx;
    }
    &.large {
      width: 96rpx;
      height: 96rpx;
    }
  }
  
  // 块级按钮
  &.block {
    width: 100%;
  }
  
  // 仅图标按钮
  &.icon-only {
    padding: 0;
    width: 88rpx;
    &.small {
      width: 64rpx;
    }
    &.large {
      width: 96rpx;
    }
  }
  
  // 禁用状态
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  // 加载状态
  &.loading {
    opacity: 0.8;
    pointer-events: none;
  }
  
  .loading-icon {
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16rpx;
    
    .loading-circular {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      border: 3rpx solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      animation: loading-rotate 0.8s linear infinite;
    }
  }
  
  .button-icon {
    margin-right: 12rpx;
  }
  
  .button-text {
    &.with-icon {
      margin-left: 8rpx;
    }
  }
}

@keyframes loading-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>