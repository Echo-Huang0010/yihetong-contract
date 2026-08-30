<template>
  <view class="page">
    <view class="list" v-if="List.length">
      <!-- TO DO 判断当前使用 签名链接替换-->
      <view class="item" @click="pick(item, i)" v-for="(item, i) in List" :key="item.id">
        <image :src="item.sealUrl" mode="aspectFill"></image>
        <!-- <view class="flex-ct cur">
          <uni-icons type="checkmarkempty"></uni-icons>
          <text>当前使用</text>
        </view> -->
        <view class="text-elps">{{ item.title }}</view>
      </view>
    </view>
    <loadMore v-if="loading"></loadMore>
    <baseline v-if="showBaseline"></baseline>
    <view class="flex-col">
      <BaseEmpty v-if="noData" massage="暂无数据~"></BaseEmpty>
    </view>

    <btn-fixed>
      <navigator v-if="userInfo.companyId" url="./createCompany" class="btn-primary">
        添加企业印章
      </navigator>
      <navigator v-else url="./createPersonal" class="btn-primary">添加个人印章</navigator>
    </btn-fixed>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import userInfoApi from '@/api/api.js';
import { deleteSeal, listSeal } from '@/api/seal.js';
export default {
  data() {
    return {
      List: [],
      loading: true,
    };
  },
  computed: {
    noData() {
      return !this.loading && !this.List.length;
    },
    showBaseline() {
      return !this.loading && this.List.length > 10;
    },
    ...mapState(['token']),
    ...mapState(['userInfo']),
  },
  onShow() {
    this.getData();
  },
  onLoad() {
    console.log(this.userInfo);
  },
  methods: {
    getData() {
      listSeal({ sealType: this.userInfo.companyId ? 2 : 1 }).then(data => {
        console.log(data);
        this.List = data || [];
        this.loading = false;
        uni.stopPullDownRefresh();
      });
    },
    pick(item, i) {
      const that = this;
      uni.showActionSheet({
        itemList: ['删除'],
        itemColor: '#ff0003',
        success: function (response) {
          console.log(response);
          console.log(item);
          uni.showModal({
            title: '删除提醒',
            content: '签名删除后，将不可恢复，是否继续',
            confirmText: '删除',
            confirmColor: '#ff0003',
            cancelColor: '#999999',
            success: function (res) {
              if (res.confirm) {
                deleteSeal(item.id).then(() => {
                  that.List.splice(i, 1);
                });
              }
            },
          });
        },
      });
    },
  },
  onReachBottom() {},
  onPullDownRefresh() {
    this.loading = true;
    this.getData();
  },
};
</script>

<style lang="scss" scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 32rpx;
  .btn-primary {
    height: 88rpx;
    border-radius: 8rpx;
  }
}
.list {
  display: flex;
  flex-wrap: wrap;
  margin-right: -24rpx;
  .item {
    overflow: hidden;
    width: calc(50% - 24rpx);
    background-color: #ffffff;
    position: relative;
    margin-bottom: 24rpx;
    border-radius: 12rpx;
    margin-right: 24rpx;
    position: relative;
    image {
      width: 100%;
      height: 248rpx;
      display: block;
    }
    .text-elps{
      text-align: center;
      padding: 20rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      font-size: 28rpx;
      color: #333;
    }
    .cur {
      display: none;
      position: absolute;
      width: 100%;
      left: 0;
      bottom: 0;
      height: 60rpx;
      background: #ebf1ff;
      text {
        color: $uni-color-primary;
        font-weight: bold;
        padding-left: 6rpx;
      }
      ::v-deep {
        .uni-icons {
          color: $uni-color-primary !important;
          font-weight: bold;
          font-size: 46rpx !important;
          position: relative;
          top: 4rpx;
        }
      }
    }
    &.active {
      border: 1px solid $uni-color-primary;
      .cur {
        display: flex;
      }
    }
  }
}
</style>
