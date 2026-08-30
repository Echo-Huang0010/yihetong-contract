/*
 * @Description:
 * @LastEditTime: 2023-06-09 10:26:38
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import fs from 'fs';
import path, { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import svgLoader from 'vite-svg-loader';

const projectRoot = path.resolve(__dirname, '..').replace(/\\/g, '/');

export default defineConfig({
  root: projectRoot,
  plugins: [
    vue(),
    vueJsx(),
    svgLoader({ svgoConfig: {} }),
    {
      name: 'copy-home-callback-html',
      generateBundle() {
        const homeHtml = path.resolve(__dirname, '../home.html');
        if (fs.existsSync(homeHtml)) {
          this.emitFile({
            type: 'asset',
            fileName: 'home.html',
            source: fs.readFileSync(homeHtml, 'utf-8'),
          });
        }
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, '../src'),
      },
      {
        find: 'assets',
        replacement: resolve(__dirname, '../src/assets'),
      },
      {
        find: 'vue-i18n',
        replacement: 'vue-i18n/dist/vue-i18n.cjs.js', // Resolve the i18n warning issue
      },
      {
        find: 'vue',
        replacement: 'vue/dist/vue.esm-bundler.js', // compile template
      },
    ],
    extensions: ['.ts', '.js'],
  },
  define: {
    'process.env': {},
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          hack: `true; @import (reference) "${resolve(
            'src/assets/style/breakpoint.less'
          )}";`,
        },
        javascriptEnabled: true,
      },
    },
  },
});
