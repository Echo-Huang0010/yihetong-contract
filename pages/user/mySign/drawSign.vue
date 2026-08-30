<template>
  <view class="page flex">
    <!-- <view class="title">绘制签名</view>
    <view class="tip">*请在以下区域签署您的姓名，避免错别字或过于潦草导致无法律效力。</view> -->
    <view class="footer">
      <view class="flex-1"></view>
      <view class="right" @click="clear">清除</view>
      <view class="left" @click="finish">保存</view>
    </view>
    <view class="flex-1 canvas-box">
      <canvas
        class="mycanvas"
        canvas-id="mycanvas"
        @touchstart="touchstart"
        @touchmove="touchmove"
        @touchend="touchend"
      ></canvas>
      <canvas canvas-id="camCacnvs" disable-scroll="true" class="canvs-bak"></canvas>
    </view>
  </view>
</template>

<script>
var x = 20;
var y = 20;
import { upload } from '@/api/oss.js';
export default {
  data() {
    return {
      ctx: '',
      points: [],
      width: 0,
      height: 0,
      signed: false,
    };
  },
  onLoad() {
    this.ctx = uni.createCanvasContext('mycanvas', this);
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const query = uni.createSelectorQuery().in(this);
    query
      .select('.canvas-box')
      .boundingClientRect(data => {
        this.height = data.height;
        this.width = data.width;
      })
      .exec();
  },
  methods: {
    touchstart: function (e) {
      let startX = e.changedTouches[0].x;
      let startY = e.changedTouches[0].y;
      let startPoint = { X: startX, Y: startY };
      this.points.push(startPoint);
      this.ctx.beginPath();
      console.log('touchstart');
    },

    touchmove: function (e) {
      let moveX = e.changedTouches[0].x;
      let moveY = e.changedTouches[0].y;
      let movePoint = { X: moveX, Y: moveY };
      this.points.push(movePoint); //存点
      let len = this.points.length;
      if (len >= 2) {
        this.draw();
      }
      this.signed = true;
    },
    touchend: function () {
      this.points = [];
      console.log('touchend');
    },
    draw: function () {
      let point1 = this.points[0];
      let point2 = this.points[1];
      this.points.shift();
      this.ctx.moveTo(point1.X, point1.Y);
      this.ctx.lineTo(point2.X, point2.Y);
      this.ctx.stroke();
      this.ctx.draw(true);
    },

    //清空画布
    clear: function () {
      let that = this;
      uni.getSystemInfo({
        success: function (res) {
          let canvasw = res.windowWidth;
          let canvash = res.windowHeight;
          that.ctx.clearRect(0, 0, canvasw, canvash);
          that.ctx.draw(true);
          that.signed = false;
        },
      });
    },

    //完成绘画并保存到本地
    finish: function () {
      if (!this.signed) {
        uni.showToast({
          title: '请先签名',
          icon: 'none',
        });
        return;
      }
      const that = this;
      uni.canvasToTempFilePath({
        canvasId: 'mycanvas',
        success: function (res) {
          let tempPath = res.tempFilePath;
          const ctx = uni.createCanvasContext('camCacnvs', that);
          ctx.translate(0, that.width);
          ctx.rotate((-90 * Math.PI) / 180);
          ctx.drawImage(tempPath, 0, 0, that.width, that.height);
          ctx.draw();
          setTimeout(() => {
            uni.canvasToTempFilePath({
              canvasId: 'camCacnvs',
              success: function (newRes) {
                console.log(newRes.tempFilePath);
                upload([
                  {
                    path: newRes.tempFilePath,
                    size: 500,
                  },
                ]).then(path => {
                  if (path) {
                    console.log(path[0].url);
                    uni.$emit('url', path[0].url);
                    uni.navigateBack();
                  }
                });
              },
            });
          }, 500);
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.page {
  background-color: #ffffff;
  height: 100vh;
  overflow: hidden;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  .canvas-box {
    width: calc(100% - 140rpx);
    height: 100vh;
    border: 1px dashed #eeeeee;
    position: relative;
    border-radius: 8rpx;
    background: #fafafa;
    position: relative;
    margin-left: 140rpx;
    &:before {
      content: '签名区';
      position: absolute;
      left: 50%;
      top: 50%;
      font-size: 90rpx;
      letter-spacing: 24rpx;
      word-break: keep-all;
      color: #eeeeee;
      transform: translate(-50%, -50%) rotate(90deg);
    }
    .mycanvas {
      width: 100%;
      height: 100%;
    }
    .canvs-bak {
      width: 100vh;
      height: calc(100vw - 140rpx);
      position: fixed;
      left: 750rpx;
    }
  }

  .footer {
    width: 140rpx;
    font-size: 32rpx;
    height: 100vh;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    position: fixed;
    .left,
    .right {
      line-height: 100rpx;
      width: 280rpx;
      text-align: center;
      font-weight: bold;
      border-radius: 6rpx;
    }
    .left {
      background: #007aff;
      color: white;
      transform: rotate(90deg) translateX(-100%);
    }
    .right {
      background: #eeeeee;
      color: #666666;
      transform: rotate(90deg) translateX(100%);
    }
  }
}
</style>
