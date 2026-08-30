<template>
  <view class="card-header">
    <view class="header-left">
      <view class="red-bar" v-if="isBar"></view>
      <view class="header-title">{{ title }}</view>
    </view>
    <view class="header-right" v-if="showMore && !$slots.right" @click="handleMoreClick">
      <text class="more-text">{{ moreText }}</text>
      <text class="arrow-icon iconfont icon-arrow-right">></text>
    </view>
    <slot name="right"></slot>
  </view>
</template>

<script>
export default {
  name: 'CardHeader',
  props: {
    isBar:{
      type:Boolean,
      default:false
    },
    title: {
      type: String,
      required: true
    },
    moreText: {
      type: String,
      default: '查看更多'
    },
    showMore: {
      type: Boolean,
      default: true
    },
    moreLink: {
      type: String,
      default: ''
    },
    isTab: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleMoreClick() {
      if (this.moreLink) {
        this.$emit('more-click');
        this.common.navigateTo(this.moreLink, this.isTab ? 1 : 0);
      } else {
        this.$emit('more-click');
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .red-bar {
      width: 6rpx;
      height: 30rpx;
      background-color: #317CFF;
      border-radius: 120rpx;
      margin-right: 8rpx;
    }
    
    .header-title {
      font-size: 30rpx;
      color: #317CFF;
      font-weight: bold;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    
    .more-text {
      font-size: 24rpx;
      color: #6E7C93;
    }
    
    .arrow-icon {
      font-size: 24rpx;
      color: #6E7C93;
      margin-left: 4rpx;
    }
  }
}
</style> 