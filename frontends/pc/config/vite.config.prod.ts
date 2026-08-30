/*
 * @Description:
 * @LastEditTime: 2023-03-03 13:51:18
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-03-03 13:50:49
 */
import { mergeConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import baseConfig from './vite.config.base';

export default mergeConfig(
  {
    mode: 'production',
    server: {
      open: true,
      fs: {
        strict: true,
      },
    },
    plugins: [
      eslint({
        cache: false,
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
        exclude: ['node_modules'],
      }),
    ],
  },
  baseConfig
);
