/*
 * @Author: wudi
 * @Date: 2023-05-22 10:28:05
 * @LastEditors: 何俊峰
 * @LastEditTime: 2023-06-13 16:28:38
 * @Description: 经办合同
 */
import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const handlingEnter: AppRouteRecordRaw = {
  path: '/handlingEnter',
  name: 'handlingEnter',
  component: DEFAULT_LAYOUT,
  redirect: '/handlingEnter/List',
  meta: {
    locale: '经办合同',
    requiresAuth: true,
    icon: 'icon-file',
    order: 5,
    hideChildrenInMenu: true,
    roles: ['admin'],
  },
  children: [
    {
      path: 'list', // The midline path complies with SEO specifications
      name: 'handlingEnterList',
      component: () => import('@/views/customList/search-table/index.vue'),
      meta: {
        locale: '',
        requiresAuth: true,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'handlingEnter',
        activeMenu: 'handlingEnter',
      },
    },
    {
      path: 'detail', // The midline path complies with SEO specifications
      name: 'handlingEnterDetail',
      component: () => import('@/views/contract/detail/index.vue'),
      meta: {
        locale: '详情',
        requiresAuth: false,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'handlingEnter',
        activeMenu: 'handlingEnter',
      },
    },
  ],
};

export default handlingEnter;
