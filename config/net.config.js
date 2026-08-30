/**
 * 环境说明
 * mock：mock环境
 * dev：开发环境
 * test：测试环境
 * testUat: 测试用户体验环境
 * uat：用户体验环境
 * prod：生产环境
 */
const buildEnv =
  typeof process !== 'undefined' && process && process.env ? process.env : {};

function requireProductionUrl(value, variableName) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized && buildEnv.NODE_ENV === 'production') {
    throw new Error(`${variableName} is required for a production build`);
  }
  return normalized;
}

const productionApiUrl = requireProductionUrl(
  buildEnv.VUE_APP_YHT_API_BASE_URL,
  'VUE_APP_YHT_API_BASE_URL',
);
const productionManageUrl = requireProductionUrl(
  buildEnv.VUE_APP_YHT_MANAGE_ADMIN_URL,
  'VUE_APP_YHT_MANAGE_ADMIN_URL',
);
const developmentApiUrl =
  buildEnv.VUE_APP_MINI_API_BASE ||
  buildEnv.VUE_APP_YHT_DEV_API_BASE_URL ||
  productionApiUrl ||
  '/api';
const trialApiUrl =
  buildEnv.VUE_APP_YHT_TEST_API_BASE_URL || productionApiUrl || '/api';
const developmentManageUrl =
  buildEnv.VUE_APP_YHT_DEV_MANAGE_ADMIN_URL || productionManageUrl || '/';
const trialManageUrl =
  buildEnv.VUE_APP_YHT_TEST_MANAGE_ADMIN_URL || productionManageUrl || '/';

export default {
  baseUrl: 'https://api.example.invalid',
  requestUrl: {
    dev: developmentApiUrl,
    test: trialApiUrl,
    prod: productionApiUrl,
  },
  manageAdminUrls: {
    dev: developmentManageUrl,
    test: trialManageUrl,
    prod: productionManageUrl,
  },
};
