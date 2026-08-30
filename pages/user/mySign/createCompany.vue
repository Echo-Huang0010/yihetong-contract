<template>
  <view class="page">
    <view class="box">
      <view class="item flex-sb">
        <view class="text-required bold">签名方式</view>
        <pickWay
          :list="[
            {
              name: '模板印章',
              value: 1,
            },
            {
              name: '本地上传',
              value: 2,
            },
          ]"
          :model="FormData.type"
          @change="
            e => {
              FormData.type = e;
              FormData.sealUrl = '';
            }
          "
        />
      </view>
      <view class="item flex-sb">
        <view class="text-required bold">签名名称</view>
        <input
          type="text"
          :maxlength="20"
          v-model="FormData.title"
          placeholder="请输入"
          placeholder-class="place"
        />
      </view>
    </view>
    <!-- 模板签名 -->
    <template v-if="FormData.type === 1">
      <view class="box sign-box">
        <view class="item flex-sb">
          <view class="bold">预览签名</view>
        </view>
        <view class="item">
          <view class="template-sign flex-ct">
            <image class="seal" v-if="tempFilePath" :src="tempFilePath"></image>
          </view>
          <view style="position: fixed; left: 900rpx">
            <feng-seal
              v-if="showSeal"
              ref="seal"
              size="420rpx"
              :color="FormData.sealColor"
              :inCircle="true"
              :companyText="userInfo.companyName"
              @change="onSealFinish"
            ></feng-seal>
          </view>
        </view>
      </view>
      <view class="box">
        <pickColor ref="color" :color="FormData.sealColor" @change="onChange" />
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
    <view class="box sign-box" v-else-if="FormData.type === 2">
      <view class="item flex-sb">
        <view class="bold">预览签名</view>
      </view>
      <view class="item">
        <template v-if="FormData.sealUrl">
          <view class="template-sign flex-ct">
            <image class="seal" :src="FormData.sealUrl"></image>
          </view>
          <view class="flex-ct" @click="FormData.sealUrl = ''">
            <uni-icons type="refreshempty" color="#FF6565" size="18"></uni-icons>
            <text class="color-primary text-28">重新上传</text>
          </view>
        </template>
        <view class="manual-sign flex-ct" v-else>
          <view class="manual-box" @click="onChooseImage">
            <view class="manual-btn">+ 本地上传</view>
            <view class="manual-tip">保存到本地相册后上传</view>
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
import { mapState } from 'vuex';
import pickWay from './components/pickWay';
import pickColor from './components/pickColor';
import { upload } from '@/api/oss.js';
import { addSeal } from '@/api/seal.js';
export default {
  components: { pickWay, pickColor },
  computed: {
    ...mapState(['userInfo']),
  },
  data() {
    return {
      showSeal: true,
      FormData: {
        type: 1,
        sealColor: '#000000',
        sealType: 2, // 印章类型(1:个人印章;2:企业印章;)
        title: '',
        sealUrl: '',
      },
      tempFilePath: '',
      loading: false,
    };
  },
  onLoad() {},
  methods: {
    onSubmit() {
      if (!this.FormData.title) {
        uni.showToast({ title: '请输入签名名称', icon: 'none' });
        return;
      }
      this.loading = true;
      if (this.FormData.type === 1) {
        if (this.tempFilePath) {
          upload([
            {
              path: this.tempFilePath,
              size: 500,
            },
          ])
            .then(path => {
              if (path) {
                this.FormData.sealUrl = path[0].url;
                this.add();
              }
            })
            .catch(() => {
              this.loading = false;
            });
        }
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
    onSealFinish() {
      this.$refs.seal.make().then(res => {
        this.tempFilePath = res.tempFilePath;
      });
    },
    onChange(e) {
      this.showSeal = false;
      this.FormData.sealColor = e;
      setTimeout(() => {
        this.showSeal = true;
      }, 1);
    },
    onChooseImage() {
      const that = this;
      uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        camera: 'back',
        success(res) {
          console.log(res);
          upload([
            {
              path: res.tempFiles[0].tempFilePath,
              size: res.tempFiles[0].size,
            },
          ]).then(path => {
            if (path) {
              that.FormData.sealUrl = path[0].url;
            }
          });
        },
      });
    },
    onBlur() {
      if (this.FormData.title.trim()) {
        this.showSeal = false;
        setTimeout(() => {
          this.showSeal = true;
        }, 1);
      }
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
    &.sign-box {
      min-height: 556rpx;
    }
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
        .seal {
          width: 320rpx;
          height: 320rpx;
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
            text-align: center;
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
