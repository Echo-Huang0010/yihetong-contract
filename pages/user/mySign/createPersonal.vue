<template>
  <view class="page">
    <view class="box">
      <view class="item flex-sb">
        <view class="text-required bold">签名方式</view>
        <pickWay :model="FormData.type" @change="e => (FormData.type = e)" />
      </view>
      <view class="item flex-sb">
        <view class="text-required bold">签名名称</view>
        <input
          type="text"
          :maxlength="12"
          v-model="FormData.title"
          placeholder="请输入"
          placeholder-class="place"
        />
      </view>
    </view>
    <!-- 模板签名 -->
    <template v-if="FormData.type === 1">
      <view class="box">
        <view class="item flex-sb">
          <view class="bold">预览签名</view>
        </view>
        <view class="item">
          <view class="template-sign flex-ct">
            <text class="name" :style="{ color: FormData.sealColor }">{{ userInfo.nickname }}</text>
          </view>
          <nameCanvas
            style="position: fixed; left: 1000rpx"
            ref="title"
            :color="FormData.sealColor"
            :name="userInfo.nickname"
          />
        </view>
      </view>
      <view class="box">
        <pickColor
          ref="color"
          :color="FormData.sealColor"
          @change="e => (FormData.sealColor = e)"
        />
        <view class="item flex-sb" @click="$refs.color.show(FormData.sealColor)">
          <view class="text-required bold">签名颜色</view>
          <view class="flex-fs">
            <view
              class="color"
              :style="{
                backgroundColor: FormData.sealColor,
              }"
            ></view>
            <uni-icons type="right" color="#B3B3B3" size="15"></uni-icons>
          </view>
        </view>
      </view>
    </template>
    <view class="box" v-else-if="FormData.type === 2">
      <view class="item flex-sb">
        <view class="bold">预览签名</view>
      </view>
      <view class="item">
        <template v-if="FormData.sealUrl">
          <image class="template-sign" mode="widthFix" :src="FormData.sealUrl"></image>
          <navigator url="./drawSign" open-type="navigate" hover-class="none" class="flex-ct">
            <uni-icons type="refreshempty" color="#FF6565" size="18"></uni-icons>
            <text class="color-primary text-28">重新手写</text>
          </navigator>
        </template>
        <view class="manual-sign flex-ct" v-else>
          <view class="manual-box">
            <navigator url="./drawSign" open-type="navigate" hover-class="none" class="manual-btn">
              + 手写签名
            </navigator>
            <view class="manual-tip">在手机屏幕上绘制本人真是的个人签名</view>
          </view>
        </view>
      </view>
    </view>

    <btn-fixed>
      <button :disabled="loading" class="btn-primary" @click="onSubmit">确认提交</button>
    </btn-fixed>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import pickWay from './components/pickWay';
import pickColor from './components/pickColor';
import nameCanvas from './components/nameCanvas';
import { addSeal } from '@/api/seal.js';
export default {
  components: { pickWay, pickColor, nameCanvas },
  computed: {
    ...mapState(['userInfo']),
  },
  data() {
    return {
      FormData: {
        type: 1,
        sealType: 1, // 印章类型(1:个人印章;2:企业印章;)
        sealColor: '#000000',
        title: '',
        sealUrl: '',
      },
      loading: false,
    };
  },
  onShow() {
    const that = this;
    uni.$once('url', function (data) {
      if (data) {
        that.FormData.sealUrl = data;
      }
    });
  },
  methods: {
    onSubmit() {
      if (!this.FormData.title) {
        uni.showToast({ title: '请输入签名名称', icon: 'none' });
        return;
      }
      this.loading = true;
      if (this.FormData.type === 1) {
        this.$refs.title
          .make()
          .then(url => {
            this.FormData.sealUrl = url;
            this.add();
          })
          .catch(() => {
            this.loading = false;
          });
      } else {
        this.add();
      }
    },
    add() {
      addSeal(this.FormData)
        .then(() => {
          uni.showToast({
            title: '添加成功',
            icon: 'none',
          });
          uni.navigateBack();
        })
        .catch(() => {
          this.loading = false;
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 32rpx;
  .box {
    background: white;
    border-radius: 12rpx;
    margin-bottom: 24rpx;
    padding: 0 32rpx;
    .item {
      min-height: 104rpx;
      padding: 30rpx 0;
      border-bottom: 1px solid rgba(230, 230, 230, 0.8);
      &:nth-last-child(1) {
        border-bottom: none;
      }
      input {
        text-align: right;
      }
      .template-sign {
        width: 100%;
        height: 350rpx;
        .name {
          font-size: 50rpx;
          font-weight: bold;
        }
      }
      .manual-sign {
        height: 350rpx;
        .manual-box {
          .manual-btn {
            width: 324rpx;
            margin: 0 auto 28rpx;
            line-height: 88rpx;
            border-radius: 8rpx;
            text-align: center;
            color: $uni-color-primary;
            background: #ffffff;
            border: 1px solid rgba(204, 204, 204, 0.8);
          }
          .manual-tip {
            color: #cccccc;
            font-size: 28rpx;
          }
        }
      }

      .color {
        width: 88rpx;
        height: 52rpx;
        margin-right: 20rpx;
        border-radius: 2rpx;
      }
    }
  }

  .btn-primary {
    line-height: 88rpx;
  }
}
</style>
