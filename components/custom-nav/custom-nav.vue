<template>
  <view
    class="custom-nav"
    :class="{ 'custom-nav--transparent': transparent }"
    :style="navStyle"
  >
    <view class="custom-nav__bar" :style="barStyle">
      <view v-if="showBack" class="nav-back" @click="goBack">
        <uni-icons type="left" size="22" :color="backIconColor"></uni-icons>
      </view>
      <view class="nav-title">{{ title }}</view>
    </view>
  </view>
</template>

<script>
const DEFAULT_NAVIGATION_BAR_HEIGHT = 44;

export default {
  name: 'custom-nav',
  props: {
    title: {
      type: String,
      default: ''
    },
    showBack: {
      type: Boolean,
      default: true
    },
    transparent: {
      type: Boolean,
      default: false
    },
    backIconColor: {
      type: String,
      default: '#1f2937'
    }
  },
  computed: {
    navStyle() {
      const style = {
        height: `${this.statusBarHeight + this.navigationBarHeight}px`,
        paddingTop: `${this.statusBarHeight}px`
      };
      // #ifdef MP-WEIXIN
      // 部分 HarmonyOS 真机上 getWindowInfo/getSystemInfoSync 均拿不到
      // statusBarHeight，导致标题贴顶。此时改用 CSS 安全区，让渲染层
      // 按设备真实 inset 计算，而不是停留在 0。
      if (this.statusBarHeight <= 0) {
        style.height = `calc(${this.navigationBarHeight}px + env(safe-area-inset-top, 0px))`;
        style.paddingTop = 'env(safe-area-inset-top, 0px)';
      }
      // #endif
      // H5 的页面视口已经排除了浏览器自身顶栏，不能再用小程序状态栏高度。
      // 仅在全面屏 WebView 暴露安全区时由 CSS env() 增加真实 inset。
      // #ifdef H5
      style.height = 'calc(44px + env(safe-area-inset-top, 0px))';
      style.paddingTop = 'env(safe-area-inset-top, 0px)';
      // #endif
      return style;
    },
    barStyle() {
      return {
        height: `${this.navigationBarHeight}px`
      };
    }
  },
  data() {
    return {
      statusBarHeight: 0,
      navigationBarHeight: DEFAULT_NAVIGATION_BAR_HEIGHT
    };
  },
  created() {
    this.updateNavigationMetrics();
  },
  mounted() {
    // 部分真机在组件 created 阶段尚未返回稳定胶囊数据，挂载后再校准一次。
    this.updateNavigationMetrics();
  },
  methods: {
    updateNavigationMetrics() {
      this.navigationBarHeight = DEFAULT_NAVIGATION_BAR_HEIGHT;

      // 原生端保留系统状态栏；微信端再按胶囊位置校准标题内容区。
      // #ifndef H5
      const systemInfo = this.readSystemInfo();
      this.statusBarHeight = this.resolveStatusBarHeight(systemInfo);
      // #endif

      // #ifdef H5
      this.statusBarHeight = 0;
      // #endif

      // #ifdef MP-WEIXIN
      const menuButton = this.readMenuButtonRect();
      if (menuButton && Number(menuButton.height) > 0) {
        const menuTop = Number(menuButton.top) || 0;
        const menuHeight = Number(menuButton.height) || 0;

        // 极少数真机在页面首帧没有返回 statusBarHeight。此时用胶囊高度
        // 和微信标准内容区高度反推状态栏，而不是把标题贴到屏幕顶端。
        if (this.statusBarHeight <= 0 && menuTop > 0) {
          const estimatedGap = Math.max(
            (DEFAULT_NAVIGATION_BAR_HEIGHT - menuHeight) / 2,
            0
          );
          this.statusBarHeight = Math.max(menuTop - estimatedGap, 0);
        }

        const topGap = Math.max(menuTop - this.statusBarHeight, 0);
        const measuredHeight = menuHeight + topGap * 2;
        if (measuredHeight >= menuHeight) {
          this.navigationBarHeight = Math.max(
            measuredHeight,
            DEFAULT_NAVIGATION_BAR_HEIGHT
          );
        }
      }
      // #endif
    },
    readSystemInfo() {
      let systemInfo = {};

      // 微信真机优先使用微信原生同步 API。部分 uni-app 运行时虽然暴露
      // uni.getWindowInfo，却可能在组件首帧返回 undefined。
      // #ifdef MP-WEIXIN
      try {
        if (typeof wx !== 'undefined' && typeof wx.getWindowInfo === 'function') {
          systemInfo = wx.getWindowInfo() || {};
        }
      } catch (error) {
        systemInfo = {};
      }
      try {
        if ((!systemInfo || !systemInfo.statusBarHeight)
          && typeof wx !== 'undefined'
          && typeof wx.getSystemInfoSync === 'function') {
          systemInfo = wx.getSystemInfoSync() || systemInfo || {};
        }
      } catch (error) {
        // 后续继续使用 uni 同步 API 兜底。
      }
      // #endif

      if (!systemInfo || !systemInfo.statusBarHeight) {
        try {
          if (typeof uni.getSystemInfoSync === 'function') {
            systemInfo = uni.getSystemInfoSync() || systemInfo || {};
          }
        } catch (error) {
          systemInfo = systemInfo || {};
        }
      }

      return systemInfo || {};
    },
    resolveStatusBarHeight(systemInfo) {
      const directHeight = Number(systemInfo && systemInfo.statusBarHeight);
      if (directHeight > 0) {
        return directHeight;
      }

      const safeAreaTop = Number(
        systemInfo && systemInfo.safeArea && systemInfo.safeArea.top
      );
      return safeAreaTop > 0 ? safeAreaTop : 0;
    },
    readMenuButtonRect() {
      let menuButton = null;
      try {
        if (typeof wx !== 'undefined'
          && typeof wx.getMenuButtonBoundingClientRect === 'function') {
          menuButton = wx.getMenuButtonBoundingClientRect();
        } else if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
          menuButton = uni.getMenuButtonBoundingClientRect();
        }
      } catch (error) {
        menuButton = null;
      }
      return menuButton;
    },
    goBack() {
      uni.navigateBack({
        delta: 1
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.custom-nav {
  box-sizing: border-box;
  display: block;
  align-items: initial;
  justify-content: initial;
}

.custom-nav__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}

.nav-back {
  position: absolute;
  left: 24rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  min-width: 64rpx;
  z-index: 2;
}

.nav-title {
  max-width: calc(100% - 240rpx);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.25;
  color: #111827;
}

.custom-nav--transparent {
  background: transparent !important;
  border-bottom-color: transparent !important;
}
</style> 
