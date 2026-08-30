<template>
  <canvas
    canvas-id="name"
    :style="{
      width: width + 'px',
      height: height + 'px',
    }"
    style="border: 1px solid red"
  ></canvas>
</template>

<script>
import { upload } from '@/api/oss.js';
export default {
  props: {
    name: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#000000',
    },
  },
  data() {
    return {
      ctx: null,
      height: 200,
      width: 200,
    };
  },
  watch: {
    name: {
      handler(newValue) {
        if (newValue.length < 6) {
          this.width = 200;
        } else {
          this.width = 200 + (newValue.length - 5) * 50;
        }
        this.draw();
      },
      immediate: true,
    },
    color: {
      handler(newValue) {
        this.draw();
      },
      immediate: true,
    },
  },
  methods: {
    draw() {
      this.ctx = null;
      const fontSize = 40;
      this.ctx = uni.createCanvasContext('name', this);
      this.ctx.setFontSize(fontSize);
      this.ctx.fillStyle = this.color;
      this.ctx.fillText(
        this.name,
        this.width / 2 - this.name.length * (fontSize / 2),
        this.height / 2 + fontSize / 2
      );
      this.ctx.fillText(
        this.name,
        this.width / 2 + 1.5 - this.name.length * (fontSize / 2),
        this.height / 2 + fontSize / 2
      );
      this.ctx.draw();
    },
    make() {
      let that = this;
      return new Promise((resolve, reject) => {
        uni.canvasToTempFilePath(
          {
            canvasId: 'name',
            success(res) {
              upload([
                {
                  path: res.tempFilePath,
                  size: 500,
                },
              ]).then(path => {
                console.log(path);
                if (path) {
                  resolve(path[0].url);
                } else {
                  reject('图片上传失败');
                }
              });
            },
            fail(error) {
              reject(error);
            },
          },
          this
        );
      });
    },
  },
};
</script>

<style></style>
