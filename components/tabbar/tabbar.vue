<template>
  <view class="tabbar-box">
    <view class="flex-fs tab-list">
      <view
        v-for="(item, i) in List"
        :key="i"
        class="tab-item"
        :class="{
          active: activeTab === item.pagePath,
          pressed: pressedPath === item.pagePath,
          'is-switching': switching && pressedPath === item.pagePath
        }"
        hover-class="tab-hover"
        hover-start-time="0"
        hover-stay-time="80"
        @touchstart="setPressed(item)"
        @touchend="clearPressed"
        @touchcancel="clearPressed"
        @click="switchTab(item, i)"
      >
        <view
          class="icon-box"
          :class="{ 'mid-button': item.center }"
        >
          <image
            v-if="item.center"
            class="tab-icon mid-icon"
            :src="item.icon"
            mode="aspectFit"
          ></image>
          <image
            v-else
            class="tab-icon"
            :src="activeTab === item.pagePath ? item.iconChecked : item.iconUnchecked"
            mode="aspectFit"
          ></image>
        </view>
        <view
          class="tab-text"
          :class="{
            'active-text': activeTab === item.pagePath,
            'center-text': item.center
          }"
        >{{ item.text }}</view>
      </view>
    </view>
  </view>
</template>
<script>
import { mapState } from 'vuex';

export default {
  data() {
    return {
      activeTab: '',
      switching: false,
      pressedPath: '',
      allList: [
        {
          text: '首页',
          pagePath: '/pages/home/index',
          icon: '/static/ic_home.svg',
          iconChecked: 'https://resource.yi-types.com/new-sign/ic_home_checked.webp',
          iconUnchecked: 'https://resource.yi-types.com/new-sign/ic_home_uncheck.webp',
        },
        {
          text: '服务助手',
          pagePath: '/pages/ai/index',
          icon: '/static/ic_content.svg',
          iconChecked: 'https://resource.yi-types.com/new-sign/ic_content_checked.webp',
          iconUnchecked: 'https://resource.yi-types.com/new-sign/ic_content_uncheck.webp',
          featureKey: 'serviceAssistantEnabled',
        },
        {
          text: '发起签署',
          notTabbar: true,
          center: true,
          pagePath: '/pages/contract/sign/index',
          icon: 'https://resource.yi-types.com/new-sign/ic_sign.webp',
          featureKey: 'startContractEnabled',
        },
        {
          text: '合同管理',
          pagePath: '/pages/contract/index',
          icon: '/static/ic_contract.svg',
          iconChecked: 'https://resource.yi-types.com/new-sign/ic_contract_checked.webp',
          iconUnchecked: 'https://resource.yi-types.com/new-sign/ic_contract_uncheck.webp',
        },
        {
          text: '我的',
          pagePath: '/pages/user/index',
          icon: '/static/ic_my.svg',
          iconChecked: 'https://resource.yi-types.com/new-sign/ic_my_checked.webp',
          iconUnchecked: 'https://resource.yi-types.com/new-sign/ic_my_uncheck.webp',
        },
      ],
    };
  },
  computed: {
    ...mapState(['brandConfig']),
    List() {
      const brandConfig = this.brandConfig || {};
      return this.allList.filter(item => {
        if (item.featureKey && brandConfig[item.featureKey] === false) {
          return false;
        }
        return true;
      });
    },
  },
  created() {
    uni.hideTabBar();
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage.route;
    this.activeTab = '/' + route;
    this.$nextTick(() => this.ensureActiveTabAvailable(this.List));
  },
  watch: {
    List(list) {
      this.ensureActiveTabAvailable(list);
    },
  },
  methods: {
    setPressed(item) {
      this.pressedPath = item.pagePath;
    },
    clearPressed() {
      if (!this.switching) {
        this.pressedPath = '';
      }
    },
    ensureActiveTabAvailable(list) {
      if (!this.activeTab || list.some(item => item.pagePath === this.activeTab)) {
        return;
      }
      const fallback = list.find(item => !item.notTabbar);
      if (fallback) {
        this.switchTab(fallback);
      }
    },
    switchTab(item) {
      if (this.activeTab === item.pagePath || this.switching) return;
      this.switching = true;
      this.pressedPath = item.pagePath;
      const unlock = result => {
        const ok = result && typeof result.errMsg === 'string' && result.errMsg.indexOf(':ok') > -1;
        setTimeout(() => {
          this.switching = false;
          this.pressedPath = '';
        }, ok ? 220 : 0);
      };
      if (item.notTabbar) {
        uni.navigateTo({
          url: item.pagePath,
          // #ifdef H5
          animationType: 'pop-in',
          animationDuration: 180,
          // #endif
          complete: unlock,
        });
      } else {
        uni.switchTab({
          url: item.pagePath,
          complete: unlock,
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.tabbar-box {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;

  .tab-list {
    background: #ffffff;
    height: 112rpx;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
    border-radius: 24rpx 24rpx 0 0;

    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-sizing: border-box;
      padding-bottom: 8rpx;
      transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms;
      -webkit-tap-highlight-color: transparent;

      &.pressed,
      &.tab-hover {
        opacity: 0.86;

        .icon-box,
        .tab-text {
          transform: translateY(2rpx) scale(0.96);
        }
      }

      &.is-switching {
        pointer-events: none;
      }

      &.is-switching::before {
        content: '';
        position: absolute;
        top: 8rpx;
        left: 50%;
        width: 44rpx;
        height: 44rpx;
        border-radius: 50%;
        background: rgba(49, 124, 255, 0.08);
        transform: translateX(-50%);
        animation: tab-switch-pulse 220ms ease-out;
      }

      &.active {
        .icon-box:not(.mid-button) {
          transform: translateY(-3rpx);
        }

        .tab-text {
          font-weight: bold;
          color: #317CFF;
          transform: translateY(-1rpx);
          transition: color 160ms ease, transform 160ms ease;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 8rpx;
          left: 50%;
          width: 28rpx;
          height: 4rpx;
          border-radius: 999rpx;
          background: #317CFF;
          transform: translateX(-50%);
        }
      }

      .icon-box {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 48rpx;
        width: 48rpx;
        position: relative;

        &.mid-button {
          border-radius: 50%;
          width: 96rpx;
          height: 96rpx;
          margin-bottom: 4rpx;
          margin-top: -46rpx;
        }

        .tab-icon {
          width: 48rpx;
          height: 48rpx;
          transition: transform 160ms ease, opacity 160ms ease;

          &.mid-icon {
            width: 96rpx;
            height: 96rpx;
          }
        }
      }

      .tab-text {
        font-size: 24rpx;
        color: #8C8C8C;
        line-height: 1;
        margin-top: 6rpx;
        transition: color 160ms ease, transform 160ms ease, opacity 160ms ease;
        white-space: nowrap;
        max-width: 100%;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;

        &.active-text {
          color: #317CFF;
        }

        &.center-text {
          color: #353D4B;
          font-size: 22rpx;
          margin-top: 0;
        }
      }
    }
  }
}

@keyframes tab-switch-pulse {
  from {
    opacity: 0.8;
    transform: translateX(-50%) scale(0.72);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) scale(1.18);
  }
}

@supports (bottom: constant(safe-area-inset-bottom)) {
  .tabbar-box {
    padding-bottom: constant(safe-area-inset-bottom);
  }
}

@supports (bottom: env(safe-area-inset-bottom)) {
  .tabbar-box {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
