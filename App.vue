<script>
export default {
  onLaunch: function (e = {}) {
    // 处理从其他小程序调起的参数
    const extraData = (e.referrerInfo && e.referrerInfo.extraData) || {};
    if(extraData.type && extraData.id) {

      // 将参数存储到本地
      uni.setStorageSync('external_params', {
        type: extraData.type,
        id: extraData.id
      });
    }
    // #ifndef H5
    let menuButtonObject = uni.getMenuButtonBoundingClientRect();
    this.globalData.menuButtonObject = menuButtonObject;
    uni.getSystemInfo({
      success: res => {
        let statusBarHeight = res.statusBarHeight,
          navHeight;
        this.globalData.iStatusBarHeight = statusBarHeight;
        navHeight = menuButtonObject.height + (menuButtonObject.top - statusBarHeight) * 2; //导航高度
        this.globalData.navHeight = navHeight;
      },
    });
    // #endif
  },
  onShow: function (e = {}) {
    // 处理从其他小程序调起的参数
    const extraData = (e.referrerInfo && e.referrerInfo.extraData) || {};
    if(extraData.type && extraData.id) {

      // 将参数存储到本地
      uni.setStorageSync('external_params', {
        type: extraData.type,
        id: extraData.id
      });
    }
  },
  onHide: function () {
  },
  globalData: {
    navHeight: 44, //导航栏的高度
    menuButtonObject: 0, //胶囊参数
    iStatusBarHeight: 0,
    tempFileInfo: null, // 临时文件信息，用于页面间传递
  },
};
</script>

<style lang="scss">
/*每个页面公共css */
@import '@/style/common.scss';
@import '@/style/ui-redesign.scss';

/* 阿里图标库通用样式 */
.iconfont {
  font-size: 48rpx;
  font-family: "iconfont" !important;
  color: currentColor;
}

.tag-status {
  padding: 0 20rpx;
  height: 40rpx;
  border-radius: 22rpx;
  align-self: flex-start;
  margin-left: 30rpx;
}

/* 页面容器 */
.container {
  width: 100%;
//   min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding: 30rpx;
//   background-color: $uni-bg-color-grey;
}

/* 页面内容区域 */
.content-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 卡片容器 */
.card-container {
  margin-bottom: 30rpx;
}

.status-color-0,
.status-color--2 {
  color: #ee6a15;
  background: #ffefe6;
}
// 已完成
.status-color-1 {
  color: #00cf15;
  background: #e6ffe8;
}
.status-color-2 {
  color: #ff0000;
  background: #fdebeb;
}
.status-color-3 {
  color: #ff0000;
  background: #fdebeb;
}
.status-color-4 {
  color: #666666;
  background: #e6e6e6;
}
.status-color-5 {
  color: #666666;
  background: #e6e6e6;
}
</style>
