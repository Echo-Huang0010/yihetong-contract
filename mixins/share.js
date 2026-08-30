import setting from '@/config/setting.js';

export default {
  onShareAppMessage() {
    const brandConfig = uni.getStorageSync('brandConfig') || setting;
    return {
      ...(brandConfig.share || setting.share),
      success() {
        uni.showToast({
          title: '分享成功',
        });
      },
      fail() {
        uni.showToast({
          title: '分享失败',
          icon: 'none',
        });
      },
    };
  },
  onShareTimeline() {
    const brandConfig = uni.getStorageSync('brandConfig') || setting;
    return {
      ...(brandConfig.share || setting.share),
      success() {
        uni.showToast({
          title: '分享成功',
        });
      },
      fail() {
        uni.showToast({
          title: '分享失败',
          icon: 'none',
        });
      },
    };
  },
};
