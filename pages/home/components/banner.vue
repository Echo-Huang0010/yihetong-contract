<template>
  <view class="swiper-box">
    <swiper class="swiper" circular @change="swiperChange" autoplay interval="5000">
      <swiper-item v-for="(item, index) in bannerItems" :key="index">
        <image class="img-banner" :src="item.img" @error="handleBannerError(index)"></image>
      </swiper-item>
    </swiper>
    <!-- Banner指示点 -->
    <view class="swiper-dots">
      <view
        v-for="(item, index) in bannerItems"
        :key="index"
        class="dot"
        :class="{ 'dot-active': index === activeIndex }"
      ></view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';

const DEFAULT_HOME_BANNER_IMAGES = ['https://resource.yi-types.com/new-sign/banner.webp'];

function normalizeBannerImages(value) {
  let items = value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) {
      items = [];
    } else {
      try {
        items = JSON.parse(raw);
      } catch (error) {
        items = raw.split(/\r?\n|,/);
      }
    }
  }
  if (!Array.isArray(items)) {
    items = [];
  }
  return items.map(item => String(item || '').trim()).filter(Boolean);
}

export default {
  data() {
    return {
      activeIndex: 0,
      failedBannerIndexes: {},
    };
  },
  computed: {
    ...mapState(['brandConfig']),
    bannerImages() {
      const images = normalizeBannerImages((this.brandConfig || {}).homeBannerImages);
      return images.length ? images : DEFAULT_HOME_BANNER_IMAGES;
    },
    bannerItems() {
      const fallback = DEFAULT_HOME_BANNER_IMAGES;
      return this.bannerImages.map((img, index) => ({
        img: this.failedBannerIndexes[index] ? fallback[0] : img,
      }));
    },
  },
  methods: {
    handleBannerError(index) {
      this.$set(this.failedBannerIndexes, index, true);
    },
    swiperChange({ detail }) {
      this.activeIndex = detail.current;
    }
  }
};
</script>

<style lang="scss" scoped>
.swiper-box {
  overflow: hidden;
  position: relative;
  height: 260rpx;
  width: 100%;
  z-index: 2;
  margin: 0;
  padding: 0;

  .swiper,
  .img-banner {
    width: 100%;
    height: 100%;
  }

  .swiper-dots {
    position: absolute;
    bottom: 28rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    z-index: 10;
  }

  .dot {
    margin-right: 8rpx;
    width: 20rpx;
    height: 8rpx;
    background: #FFFFFF;
    border-radius: 4rpx;

    &:last-child {
      margin-right: 0;
    }
  }

  .dot-active {
    background: #317CFF;
  }
}
</style>
