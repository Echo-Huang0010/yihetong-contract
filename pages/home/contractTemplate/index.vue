<template>
  <view class="page"></view>
</template>

<script>
export default {
  onLoad() {
    uni.redirectTo({
      url: '/pages/template/index',
    });
  },
  methods: {
    openTemplateFile(item) {
      if (!item || !item.fileDownloadUrl) return;
      // #ifdef H5
      window.open(item.fileDownloadUrl, '_blank');
      // #endif
      // #ifndef H5
      uni.downloadFile({
        url: item.fileDownloadUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.openDocument({ filePath: res.tempFilePath });
          }
        },
      });
      // #endif
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  .tab-list {
    height: 100%;
    width: 180rpx;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    overflow-y: auto;
    z-index: 3;
    .tab-item {
      box-sizing: border-box;
      width: 100%;
      padding: 28rpx 16rpx;
      text-align: center;
      font-size: 28rpx;
      color: #666;
      background-color: #f5f5f5;
      &.active {
        background-color: #fff;
        color: $uni-color-primary;
      }
      &.prev {
        border-bottom-right-radius: 12rpx;
      }
      &.next {
        border-top-right-radius: 12rpx;
      }
    }
  }
  .list {
    padding: 0 32rpx;
    box-sizing: border-box;
    .item {
      border-bottom: 1px solid #f5f5f5;
      color: #333;
      font-size: 28rpx;
      padding: 40rpx 0;
      .info {
        margin-top: 10rpx;
      }
    }
  }
  .right-box {
    position: relative;
    margin-left: 180rpx;
    .load-more {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      left: 50%;
    }
  }
}
</style>
