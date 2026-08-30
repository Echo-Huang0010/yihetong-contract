/*
 * @Author: wudi
 * @Date: 2023-05-22 10:28:05
 * @LastEditors: 何俊峰
 * @LastEditTime: 2023-06-09 10:47:27
 * @Description: 企业合同
 */
import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const enterprise: AppRouteRecordRaw = {
  path: '/enterprise',
  name: 'enterprise',
  component: DEFAULT_LAYOUT,
  redirect: '/enterprise/List',
  meta: {
    locale: '企业合同',
    requiresAuth: true,
    icon: 'icon-book',
    order: 6,
    hideChildrenInMenu: true,
    roles: ['admin'],
  },
  children: [
    {
      path: 'list', // The midline path complies with SEO specifications
      name: 'enterpriseList',
      component: () => import('@/views/customList/search-table/index.vue'),
      meta: {
        locale: '',
        requiresAuth: true,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'Enterprise',
        activeMenu: 'enterprise',
      },
    },
    {
      path: 'detail', // The midline path complies with SEO specifications
      name: 'EnterpriseDetail',
      component: () => import('@/views/contract/detail/index.vue'),
      meta: {
        locale: '详情',
        requiresAuth: false,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'Enterprise',
        activeMenu: 'enterprise',
      },
    },
  ],
};

export default enterprise;
