/*
 * @Author: wudi
 * @Date: 2023-05-22 10:28:05
 * @LastEditors: 何俊峰
 * @LastEditTime: 2023-06-09 10:47:56
 * @Description: 个人认证
 */
import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const member: AppRouteRecordRaw = {
  path: '/member',
  name: 'member',
  component: DEFAULT_LAYOUT,
  redirect: '/member/List',
  meta: {
    locale: '成员管理',
    requiresAuth: true,
    icon: 'icon-user-group',
    order: 4,
    hideChildrenInMenu: true,
    roles: ['admin'],
  },
  children: [
    {
      path: 'list', // The midline path complies with SEO specifications
      name: 'memberList',
      component: () => import('@/views/customList/search-table/index.vue'),
      meta: {
        locale: '',
        requiresAuth: true,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'Member',
        activeMenu: 'member',
      },
    },
    {
      path: 'add', // The midline path complies with SEO specifications
      name: 'MemberAdd',
      component: () => import('@/views/customList/customFormAdd/index.vue'),
      meta: {
        locale: '新增',
        requiresAuth: false,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'Member',
        activeMenu: 'member',
      },
    },
    {
      path: 'edit', // The midline path complies with SEO specifications
      name: 'MemberEdit',
      component: () => import('@/views/customList/customFormEdit/index.vue'),
      meta: {
        locale: '编辑',
        requiresAuth: false,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'Member',
        activeMenu: 'member',
      },
    },
    {
      path: 'detail', // The midline path complies with SEO specifications
      name: 'MemberDetail',
      component: () => import('@/views/customList/customDetail/index.vue'),
      meta: {
        locale: '详情',
        requiresAuth: false,
        roles: ['admin'],
        hideInMenu: true,
        jsonName: 'Member',
        activeMenu: 'member',
      },
    },
  ],
};

export default member;
