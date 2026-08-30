/*
 * @Description:
 * @LastEditTime: 2023-05-30 16:11:48
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import { createPinia } from 'pinia';
// eslint-disable-next-line import/no-cycle
import useAppStore from './modules/app';
import useUserStore from './modules/user';
import useTabBarStore from './modules/tab-bar';

const pinia = createPinia();

export { useAppStore, useUserStore, useTabBarStore };
export default pinia;
