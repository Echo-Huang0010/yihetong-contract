<template>
  <view class="page">
    <view class="count-box">
      <text>{{ List.length }}</text>
      份合同进行批量签署
    </view>
    <view class="flex-fs tip">
      <uni-icons type="info" color="#ffffff" size="22"></uni-icons>
      <view class="flex-1 text-24">
        将对您批量签署的{{
          List.length
        }}份合同中，页面最少的合同进行盖章签署，其他合同在同一页码、同一位置会默认批量签署
      </view>
    </view>
    <view class="list" v-if="List.length">
      <contractCard v-for="(item, i) in List" :key="item.id" :item="item" />
    </view>
    <btn-fixed>
      <button type="primary" @click="onSubmit">开始批量签署</button>
    </btn-fixed>
  </view>
</template>

<script>
import contractCard from '@/pages/home/components/contractCard';
import userInfoApi from '@/api/api.js';
import { getSignUrl } from '@/api/seal.js';
import { mapState, mapActions } from 'vuex';
export default {
  components: {
    contractCard,
  },
  data() {
    return {
      List: [],
    };
  },
  computed: {
    ...mapState(['userInfo']),
  },
  onShow() {
    const that = this;
    uni.$once('checkList', function (data) {
      that.List = data || [];
    });
  },
  methods: {
    onSubmit() {
      console.log(this.userInfo, this.List);
      // 判断渠道
      const list = this.List.map(i => {
        let url = i.signUrl.split('?')[1].split('&');
        console.log(url);
        return {
          contractId: url[0].split('=')[1],
          userId: url[1].split('=')[1],
          companyId: url[2].split('=')[1],
        };
      });
      if (this.userInfo.batchSignPlan == 2) {
        const ids = this.List.map(i => {
          return i.id;
        });
        getSignUrl({
          ids: ids,
        }).then(res => {
          if (res) {
            uni.redirectTo({
              url: '/pages/user/company/authorize?path=' + encodeURIComponent(res),
            });
          } else {
            uni.showToast({
              title: '签署链接获取失败！',
              icon: 'none',
            });
          }
        });
      } else {
        uni.showToast({
          title: '当前公开版本未启用批量签署',
          icon: 'none',
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  .count-box {
    line-height: 80rpx;
    padding: 0 30rpx;
    background: white;
    font-weight: bold;
    font-size: 28rpx;
    text {
      color: #ff0000;
    }
  }
  .tip {
    padding: 30rpx;
    background: #f59a23;
    .text-24 {
      margin-left: 20rpx;
      color: white;
      text-align: justify;
    }
  }
  .list {
    padding: 30rpx;
  }
}
</style>
