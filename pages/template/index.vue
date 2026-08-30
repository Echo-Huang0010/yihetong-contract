<template>
  <view class="page">
    <loading ref="loading" />
    <template v-if="CategoryList.length">
      <view class="sidebar-menu">
        <view
          class="menu-item"
          v-for="(item, i) in CategoryList"
          :key="i"
          :class="{
            active: i === current,
            prev: i === current - 1,
            next: i === current + 1,
          }"
          @click="tabChange(item.id, i)"
        >
          {{ item.name }}
        </view>
        <view class="menu-item flex-1" :class="{ next: list.length === current + 1 }"></view>
      </view>
      <view class="content-container">
        <view class="template-list" v-if="list.length">
          <view class="template-card" v-for="(item, i) in list" :key="i" @click="toPreview(item)">
            <view class="card-title">
              {{ item.name }}
            </view>
            <view class="card-description" v-if="item.description">
              {{ item.description }}
            </view>
          </view>
        </view>
        <BaseEmpty
          v-if="!loading && !list.length"
          style="position: relative; top: 200rpx"
          massage="没有找到相关范本"
        />
        <baseline v-if="baseline" />
        <loadMore class="load-more" v-if="loading"></loadMore>
      </view>
    </template>
    <view style="position: relative; top: 200rpx" v-if="!loading && !CategoryList.length">
      <BaseEmpty massage="没有找到相关范本" />
    </view>
  </view>
</template>

<script>
import { templateList, templateCategory } from '@/api/file.js';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      CategoryList: [],
      query: {
        pageNum: 1,
        pageSize: 15,
        categoryId: '',
        total: 0,
      },
      list: [],
      current: 0,
      loading: true,
    };
  },
  computed: {
    ...mapState(['token']),
    hasMore() {
      return this.list.length < this.query.total;
    },
    baseline() {
      return !this.loading && this.list.length === this.query.total && this.list.length > 10;
    },
  },
  filters: {
    fileName(txt) {
      return txt.slice(0, txt.lastIndexOf('.'));
    },
  },
  onLoad() {
    uni.setNavigationBarTitle({
      title: '合同模板',
    });
    if (!this.token) {
      this.loading = false;
      this.$nextTick(() => {
        if (this.$refs.loading) {
          this.$refs.loading.hide();
        }
      });
      this.common.toLogin();
      return;
    }
    this.getCategoryList();
  },
  methods: {
    getCategoryList() {
      templateCategory().then(res => {
        this.CategoryList = res || [];
        if (this.CategoryList.length) {
          this.query.categoryId = this.CategoryList[0].id;
          this.getList();
        } else {
          this.loading = false;
          this.$refs.loading.hide();
        }
      });
    },
    tabChange(id, i) {
      if (this.query.categoryId !== id) {
        this.current = i;
        this.query.categoryId = id;
        this.query.pageNum = 1;
        this.loading = true;
        this.getList();
      }
    },
    getList() {
      templateList(this.query)
        .then(res => {
          const enabledRows = ((res && res.rows) || []).filter(
            item => item && item.enableState !== false && item.enableState !== 0
          );
          if (this.query.pageNum === 1) {
            this.list = enabledRows;
          } else {
            this.list = [...this.list, ...enabledRows];
          }
          this.query.total = res.total;
        })
        .finally(() => {
          uni.stopPullDownRefresh();
          this.$refs.loading.hide();
          this.loading = false;
        });
    },
    toPreview(item) {
      if (!this.token) {
        this.common.toLogin();
        return;
      }
      uni.navigateTo({
        url: `/pages/contract/sign/signByTemplate?tid=${item.id}`,
      });
    },
    download(item) {
      if (!this.token) {
        this.common.toLogin();
        return;
      }
      uni.showLoading({ title: '正在打开' });
      // #ifdef H5
      uni.hideLoading();
      if (typeof window !== 'undefined') {
        window.open(item.fileDownloadUrl, '_blank');
      }
      return;
      // #endif
      uni.downloadFile({
        url: item.fileDownloadUrl,
        filePath: wx.env.USER_DATA_PATH + '/' + item.fileName,
        success: res => {
          uni.openDocument({
            filePath: res.filePath,
            fileType: item.fileName.split('.')[1],
            showMenu: true,
          });
        },
        complete(msg) {
          uni.hideLoading();
        },
      });
    },
  },
  onReachBottom() {
    if (this.hasMore) {
      this.query.pageNum += 1;
      this.getList();
    }
  },
  onPullDownRefresh() {
    this.tabChange(this.query.categoryId, this.current);
  },
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
//   background-color: #f0f4f9;
  display: flex;

  .sidebar-menu {
    width: 180rpx;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    overflow-y: auto;
    z-index: 3;
    background-color: #F6FAFF;
    box-shadow: 2rpx 0 12rpx rgba(0, 0, 0, 0.05);

    .menu-item {
      box-sizing: border-box;
      width: 100%;
      padding: 32rpx 16rpx;
      text-align: center;
      font-size: 28rpx;
      color: #666;
      position: relative;
      transition: all 0.3s;

      &.active {
        color: #353D4B;
        font-weight: bold;

        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 6rpx;
          height: 32rpx;
          background-color: #317CFF;
          border-radius: 0 3rpx 3rpx 0;
        }
      }

      &.prev {
        border-bottom-right-radius: 16rpx;
      }

      &.next {
        border-top-right-radius: 16rpx;
      }
    }
  }

  .content-container {
    flex: 1;
    margin-left: 180rpx;
    padding: 24rpx;

    .template-list {
      .template-card {
        background-color: #F6FAFF;
        border-radius: 16rpx;
        padding: 32rpx;
        margin-bottom: 24rpx;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
        transition: all 0.3s;

        &:active {
          transform: translateY(2rpx);
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
        }

        .card-title {
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 12rpx;
          position: relative;
          padding-left: 20rpx;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 6rpx;
            height: 24rpx;
            border-radius: 3rpx;
            background: #317CFF;
          }
        }

        .card-description {
          font-size: 26rpx;
          color: #999;
          line-height: 1.5;
        }
      }
    }

    .load-more {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      left: 50%;
    }
  }
}
</style>
