/*
 * @Author: wudi
 * @Date: 2023-05-22 10:28:05
 * @LastEditors: 何俊峰
 * @LastEditTime: 2023-06-13 16:28:53
 * @Description: 经办合同
 */
import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const handling: AppRouteRecordRaw = {
  path: '/handling',
  name: 'handling',
  component: DEFAULT_LAYOUT,
  redirect: '/handling/List',
  meta: {
    locale: '经办合同',
    requiresAuth: true,
    icon: 'icon-file',
    order: 5,
    hideChildrenInMenu: true,
    roles: ['user'],
  },
  children: [
    {
      path: 'list', // The midline path complies with SEO specifications
      name: 'handlingList',
      component: () => import('@/views/customList/search-table/index.vue'),
      meta: {
        locale: '',
        requiresAuth: true,
        roles: ['user'],
        hideInMenu: true,
        jsonName: 'Handling',
        activeMenu: 'handling',
      },
    },
    {
      path: 'detail', // The midline path complies with SEO specifications
      name: 'HandlingDetail',
      component: () => import('@/views/contract/detail/index.vue'),
      meta: {
        locale: '详情',
        requiresAuth: false,
        roles: ['user'],
        hideInMenu: true,
        jsonName: 'Handling',
        activeMenu: 'handling',
      },
    },
  ],
};

export default handling;
