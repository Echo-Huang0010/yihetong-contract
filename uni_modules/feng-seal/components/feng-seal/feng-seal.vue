<template>
  <view :class="{ hide: hidden }">
    <canvas
      canvas-id="sealCanvas"
      :style="{ width: sizeNum + 'px', height: sizeNum + 'px' }"
    ></canvas>
  </view>
</template>
<script>
import props from './props.js';
import { toPx, getFontSize } from './utils.js';
export default {
  data() {
    return {
      sizeNum: '',
      fontSize: {},
      ctx: null,
    };
  },
  mixins: [props],
  mounted() {
    this.sizeNum = toPx(this.size);
    const width = this.sizeNum / 2;
    const height = this.sizeNum / 2;
    this.fontSize = getFontSize(this.sizeNum);
    setTimeout(() => {
      // 获取canvas上下文
      this.getCtx().then(() => {
        // 绘制圆形
        this.writeCircle(width, height, width, this.sizeNum / 100);
        //绘制内部圆
        if (this.inCircle) {
          this.writeCircle(width, height, width - this.sizeNum / 40, 1);
        }
        //绘制五角星
        this.writeFiveStar(width, height);
        //绘制印章名称
        this.writeSealName(this.sealText);
        //绘制公司名称
        this.writeCompanyName(this.companyText);
        //绘制印章代码
        this.writeSealNo(this.sealCode);
        this.ctx.draw(); // 绘制图形
        this.$emit('change');
      });
    }, 500);
  },
  methods: {
    make() {
      let that = this;
      return new Promise((resolve, reject) => {
        uni.canvasToTempFilePath(
          {
            canvasId: 'sealCanvas',
            success(res) {
              if (that.imageType == 'base64') {
                // #ifdef H5
                resolve({
                  errMsg: res.errMsg,
                  tempFilePath: res.tempFilePath,
                  type: 'base64',
                });
                // #endif
                // #ifndef H5
                uni.getFileSystemManager().readFile({
                  filePath: res.tempFilePath,
                  encoding: 'base64',
                  success: file => {
                    resolve({
                      errMsg: res.errMsg,
                      tempFilePath: 'data:image/png;base64,' + file.data,
                      type: 'base64',
                    });
                  },
                  fail: error => {
                    console.error({ error, path });
                    reject(error);
                  },
                });
                // #endif
              } else {
                // #ifndef H5
                resolve({
                  errMsg: res.errMsg,
                  tempFilePath: res.tempFilePath,
                  type: 'png',
                });
                // #endif
                // #ifdef H5
                resolve({
                  errMsg: res.errMsg,
                  tempFilePath: res.tempFilePath,
                  type: 'base64',
                });
                // #endif
              }
            },
            fail(error) {
              reject(error);
            },
          },
          this
        );
      });
    },

    writeCompanyName(name) {
      this.ctx.font = `${this.fontSize.companyFontSize}px Helvetica`;
      let count = name.length;
      var angle = (4 * Math.PI) / (3 * (count - 1)); // 字间角度
      var chars = name.split('');
      var c;
      for (var i = 0; i < count; i++) {
        if (i == 0) this.ctx.rotate((5 * Math.PI) / 6);
        else this.ctx.rotate(angle); //
        this.ctx.save();
        if (this.inCircle) {
          this.ctx.translate(
            this.sizeNum / 2 - this.fontSize.companyFontSize - 10 - this.sizeNum / 40,
            0
          ); // 平移到此位置,此时字和x轴垂直
        } else {
          this.ctx.translate(this.sizeNum / 2 - this.fontSize.companyFontSize - 10, 0);
        }
        this.ctx.rotate(Math.PI / 2); // 旋转90度,让字平行于x轴
        this.ctx.fillStyle = this.color;
        this.ctx.fillText(chars[i], 0, 0); // 此点为字的中心点
        this.ctx.restore();
      }
    },
    writeSealName(name) {
      this.ctx.font = `${this.fontSize.sealTextFontSize}px Helvetica`;
      this.ctx.fillStyle = this.color;
      let data = this.ctx.measureText(name);
      this.ctx.fillText(
        name,
        -(data.width / 2),
        this.sizeNum / 2 / 2.5 + this.fontSize.sealTextFontSize
      );
    },
    writeFiveStar(width, height) {
      this.ctx.translate(width, height);
      if (this.centerImage) {
        this.ctx.drawImage(
          this.centerImage,
          -(this.sizeNum / 2.8 / 2),
          -(this.sizeNum / 2.8 / 2),
          this.sizeNum / 2.8,
          this.sizeNum / 3
        );
      } else {
        let r1 = width / 2.5;
        var r2 = r1 / 2.5;
        var x1, x2, y1, y2;
        this.ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          x1 = r1 * Math.cos(((54 + i * 72) / 180) * Math.PI);
          y1 = r1 * Math.sin(((54 + i * 72) / 180) * Math.PI);
          x2 = r2 * Math.cos(((18 + i * 72) / 180) * Math.PI);
          y2 = r2 * Math.sin(((18 + i * 72) / 180) * Math.PI);
          this.ctx.lineTo(x2, y2);
          this.ctx.lineTo(x1, y1);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
      }

      // http://tmp/LbkhkeopwcQUd9c2ce69c61df9f977ef63954975cc41.png
      // http://tmp/JFgX7SPmvfZgf02313932533e836d679641754d3c1bf.png
    },
    writeCircle(wigth, height, radius, lineWidth) {
      this.ctx.beginPath();
      this.ctx.setLineWidth(lineWidth);
      this.ctx.arc(wigth, height, radius - 10, 0, 2 * Math.PI);
      this.ctx.closePath();
      // #ifdef MP-TOUTIAO
      this.ctx.setStrokeStyle(this.color);
      // #endif

      // #ifndef MP-TOUTIAO
      this.ctx.strokeStyle = this.color;
      // #endif
      this.ctx.stroke();
    },
    writeSealNo(sealCode) {
      this.ctx.translate(0, 0); // 平移到此位置,
      this.ctx.setLineWidth(1);
      this.ctx.font = `${this.fontSize.sealCodeFontSize}px Helvetica`;
      var count = sealCode.length; // 字数
      var angle = (-4 * Math.PI) / (12 * (count - 1)); // 字间角度
      var chars = sealCode.split('');
      var c;
      for (var i = 0; i < count; i++) {
        c = chars[i]; // 需要绘制的字符
        if (i == 0) {
          this.ctx.rotate((5 * Math.PI) / 10);
        } else {
          this.ctx.rotate(angle);
        }
        this.ctx.save();
        if (this.inCircle) {
          this.ctx.translate(
            this.sizeNum / 2 - 10 - this.fontSize.sealCodeFontSize - this.sizeNum / 40,
            0
          ); // 平移到此位置,此时字和x轴垂直
        } else {
          this.ctx.translate(this.sizeNum / 2 - 10 - this.fontSize.sealCodeFontSize, 0);
        }
        this.ctx.rotate((Math.PI * 3) / 2); // 旋转90度,让字平行于x轴
        this.ctx.fillText(c, 0, 0); // 此点为字的中心点
        this.ctx.restore();
      }
    },
    getCtx() {
      return new Promise((resolve, reject) => {
        if (this.ctx) {
          resolve(ctx);
        } else {
          uni
            .createSelectorQuery()
            .in(this)
            .select('#sealCanvas')
            .boundingClientRect()
            .exec(res => {
              const ctx = uni.createCanvasContext('sealCanvas', this);
              this.ctx = ctx;
              resolve(ctx);
            });
        }
      });
    },
  },
};
</script>
<style lang="scss">
.hide {
  position: fixed;
  left: 1500px;
  top: 0;
}
</style>
