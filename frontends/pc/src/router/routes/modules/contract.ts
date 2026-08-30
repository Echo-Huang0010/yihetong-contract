import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const CONTRACT: AppRouteRecordRaw = {
  path: '/contract',
  name: 'contract',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: '合同签署',
    requiresAuth: true,
    icon: 'icon-file',
    order: 6,
  },
  children: [
    {
      path: 'templates',
      name: 'ContractTemplates',
      component: () => import('@/views/contract/templates/index.vue'),
      meta: {
        locale: '合同模板',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'documents',
      name: 'ContractDocuments',
      component: () => import('@/views/contract/documents/index.vue'),
      meta: {
        locale: '合同文书',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'create',
      name: 'ContractCreate',
      component: () => import('@/views/contract/create/index.vue'),
      meta: {
        locale: '文件合同发起签署',
        requiresAuth: true,
        roles: ['*'],
      },
    },
    {
      path: 'audit',
      name: 'ContractAudit',
      component: () => import('@/views/contract/audit/index.vue'),
      meta: {
        locale: '合同审查',
        requiresAuth: true,
        roles: ['*'],
        featureKey: 'contractAuditEnabled',
      },
    },
    {
      path: 'compare',
      name: 'ContractCompare',
      component: () => import('@/views/contract/compare/index.vue'),
      meta: {
        locale: '合同比对',
        requiresAuth: true,
        roles: ['*'],
        featureKey: 'contractCompareEnabled',
      },
    },
    {
      path: 'approval',
      name: 'ContractApproval',
      component: () => import('@/views/contract/approval/index.vue'),
      meta: {
        locale: '审批记录',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default CONTRACT;
