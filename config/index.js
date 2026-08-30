/**
 * envVersion：当前所在环境
 * 可选值：mock、dev、test、testUat、uat、prod
 */
import netConfig from './net.config.js';

let envVersion =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
    ? 'prod'
    : 'dev';
let appId = '';
let baseUrl = netConfig.requestUrl[envVersion];
let basicsUrl = baseUrl.replace(/\/api$/i, '');
let manageAdminUrl =
  netConfig.manageAdminUrls[envVersion] || netConfig.manageAdminUrls.dev;
let runtimeApiBaseLocked = false;

function trimTrailingSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function ensureTrailingSlash(value) {
  const clean = trimTrailingSlash(value);
  return clean ? clean + '/' : clean;
}

function getHttpHostname(value) {
  const match = String(value || '').trim().match(/^https?:\/\/(\[[^\]]+\]|[^/:?#]+)/i);
  return match ? match[1].replace(/^\[|\]$/g, '').toLowerCase() : '';
}

function isPrivateNetworkHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
    return true;
  }
  const parts = host.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
    return false;
  }
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }
  const first = octets[0];
  const second = octets[1];
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function normalizeHttpBase(value) {
  const clean = trimTrailingSlash(value);
  return getHttpHostname(clean) ? clean : '';
}

function decodeQueryValue(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  try {
    return decodeURIComponent(raw);
  } catch (error) {
    return raw;
  }
}

// #ifdef MP-WEIXIN
function readMiniApiBaseOverride() {
  let queryValue = '';
  let buildValue = '';
  let storedValue = '';
  try {
    const launchOptions = uni.getLaunchOptionsSync ? uni.getLaunchOptionsSync() : {};
    const query = (launchOptions && launchOptions.query) || {};
    queryValue = decodeQueryValue(query.apiBase || query.YHT_MINI_API_BASE || '');
  } catch (error) {
    queryValue = '';
  }
  try {
    buildValue =
      typeof process !== 'undefined' && process && process.env
        ? process.env.VUE_APP_MINI_API_BASE || ''
        : '';
  } catch (error) {
    buildValue = '';
  }
  try {
    storedValue = uni.getStorageSync('YHT_MINI_API_BASE') || '';
  } catch (error) {
    storedValue = '';
  }

  if (String(queryValue).toLowerCase() === 'default') {
    try {
      uni.removeStorageSync('YHT_MINI_API_BASE');
    } catch (error) {
      // Storage may be unavailable in restricted developer environments.
    }
    return '';
  }

  const explicitValue = normalizeHttpBase(queryValue || buildValue || storedValue);
  if (queryValue && explicitValue) {
    try {
      uni.setStorageSync('YHT_MINI_API_BASE', explicitValue);
    } catch (error) {
      // Storage may be unavailable in restricted developer environments.
    }
  }
  return explicitValue;
}
// #endif

// #ifdef MP-WEIXIN
const accountInfo = uni.getAccountInfoSync();
if (accountInfo.miniProgram.envVersion === 'develop') {
  envVersion = 'dev';
}
if (accountInfo.miniProgram.envVersion === 'trial') {
  envVersion = 'test';
}
if (accountInfo.miniProgram.envVersion === 'release') {
  envVersion = 'prod';
}
appId = accountInfo.miniProgram.appId;
baseUrl = netConfig.requestUrl[envVersion];
basicsUrl = baseUrl.replace(/\/api$/i, '');
manageAdminUrl = netConfig.manageAdminUrls[envVersion] || netConfig.manageAdminUrls.dev;
if (envVersion === 'dev') {
  const miniApiBaseOverride = readMiniApiBaseOverride();
  if (miniApiBaseOverride) {
    baseUrl = /\/api$/i.test(miniApiBaseOverride)
      ? miniApiBaseOverride
      : miniApiBaseOverride + '/api';
    basicsUrl = baseUrl.replace(/\/api$/i, '');
    runtimeApiBaseLocked = true;
  }
}
// #endif

// #ifdef H5
function isPrivateH5Host(hostname) {
  return isPrivateNetworkHost(hostname);
}

function normalizeH5OverrideUrl(value) {
  const clean = String(value || '').trim();
  if (!clean || !isPrivateH5Host(h5Host) || !/^https?:\/\//i.test(clean)) {
    return '';
  }
  try {
    const parsed = new URL(clean);
    if (!isPrivateH5Host(parsed.hostname) && parsed.hostname !== h5Host) {
      return '';
    }
    return clean;
  } catch (error) {
    return '';
  }
}

function normalizeTrustedRuntimeUrl(value) {
  const clean = String(value || '').trim();
  if (!/^https?:\/\//i.test(clean)) {
    return '';
  }
  try {
    const parsed = new URL(clean);
    if (
      !isPrivateH5Host(h5Host) &&
      (parsed.protocol !== 'https:' || isPrivateH5Host(parsed.hostname))
    ) {
      return '';
    }
    return parsed.hostname ? trimTrailingSlash(clean) : '';
  } catch (error) {
    return '';
  }
}

function readH5Override(queryKey, storageKey, globalKey) {
  if (typeof window === 'undefined') {
    return '';
  }
  let queryValue = '';
  try {
    const params = new URLSearchParams(window.location.search || '');
    queryValue = params.get(queryKey) || params.get(storageKey) || '';
  } catch (error) {
    queryValue = '';
  }
  if (queryValue) {
    const safeQueryValue = normalizeH5OverrideUrl(queryValue);
    if (!safeQueryValue) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        // localStorage may be unavailable in private or embedded H5 contexts.
      }
      return '';
    }
    try {
      window.localStorage.setItem(storageKey, safeQueryValue);
    } catch (error) {
      // localStorage may be unavailable in private or embedded H5 contexts.
    }
    return safeQueryValue;
  }
  const globalValue = normalizeH5OverrideUrl(window[globalKey]);
  if (globalValue) {
    return globalValue;
  }
  try {
    return normalizeH5OverrideUrl(window.localStorage.getItem(storageKey) || '');
  } catch (error) {
    return '';
  }
}

const h5Host =
  typeof window !== 'undefined' && window.location && window.location.hostname
    ? window.location.hostname
    : '127.0.0.1';
const h5Origin =
  typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : 'http://' + h5Host;
const h5ApiBaseOverride = readH5Override('apiBase', 'YHT_H5_API_BASE', 'YHT_H5_API_BASE');
const h5DefaultApiBase = isPrivateH5Host(h5Host)
  ? 'http://' + h5Host + ':8763'
  : netConfig.requestUrl[envVersion];
const h5ApiBase = trimTrailingSlash(
  h5ApiBaseOverride || h5DefaultApiBase
);
runtimeApiBaseLocked =
  Boolean(h5ApiBaseOverride) ||
  isPrivateH5Host(h5Host) ||
  (typeof window !== 'undefined' && window.YHT_H5_FORCE_LOCAL_API === true);
baseUrl = /\/api$/i.test(h5ApiBase) ? h5ApiBase : h5ApiBase + '/api';
basicsUrl = baseUrl.replace(/\/api$/i, '');
const h5DefaultManageBase = isPrivateH5Host(h5Host)
  ? 'http://' + h5Host + ':5174'
  : netConfig.manageAdminUrls[envVersion];
manageAdminUrl = ensureTrailingSlash(
  readH5Override('manageBase', 'YHT_H5_MANAGE_BASE', 'YHT_H5_MANAGE_BASE') ||
    h5DefaultManageBase ||
    h5Origin
);
// #endif

function normalizeApiBaseUrl(value) {
  const clean = trimTrailingSlash(value);
  if (!/^https?:\/\//i.test(clean)) {
    return '';
  }
  return /\/api$/i.test(clean) ? clean : clean + '/api';
}

function normalizeRuntimeApiBaseUrl(value) {
  // #ifdef H5
  if (runtimeApiBaseLocked) {
    return '';
  }
  const trustedH5Value = normalizeTrustedRuntimeUrl(value);
  return trustedH5Value ? normalizeApiBaseUrl(trustedH5Value) : '';
  // #endif
  // #ifndef H5
  if (runtimeApiBaseLocked) {
    return '';
  }
  const normalizedValue = normalizeApiBaseUrl(value);
  // #ifdef MP-WEIXIN
  if (
    envVersion !== 'dev' &&
    (!/^https:\/\//i.test(normalizedValue) || isPrivateNetworkHost(getHttpHostname(normalizedValue)))
  ) {
    return '';
  }
  // #endif
  return normalizedValue;
  // #endif
}

const runtimeConfig = {
  basicsUrl,
  baseUrl,
  manageAdminUrl,
  appId,
  ossDomain: '',
};

runtimeConfig.applyClientRuntimeConfig = function(clientConfig = {}, options = {}) {
  const apiBaseUrl =
    options.allowApiBase === false
      ? ''
      : normalizeRuntimeApiBaseUrl(clientConfig.apiBaseUrl);
  if (apiBaseUrl) {
    runtimeConfig.baseUrl = apiBaseUrl;
    runtimeConfig.basicsUrl = apiBaseUrl.replace(/\/api$/i, '');
  }
  if (clientConfig.ossDomain) {
    runtimeConfig.ossDomain = trimTrailingSlash(clientConfig.ossDomain);
  }
  if (clientConfig.miniAppId) {
    runtimeConfig.appId = clientConfig.miniAppId;
  }
  return runtimeConfig;
};

runtimeConfig.applyStoredClientRuntimeConfig = function() {
  try {
    if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
      return runtimeConfig;
    }
    const stored = uni.getStorageSync('clientConfig') || {};
    runtimeConfig.applyClientRuntimeConfig(stored, { allowApiBase: false });
  } catch (error) {
    // Storage can be unavailable in restricted H5 containers; keep static config.
  }
  return runtimeConfig;
};

runtimeConfig.getBaseUrl = function() {
  return runtimeConfig.baseUrl;
};

runtimeConfig.getBasicsUrl = function() {
  return runtimeConfig.basicsUrl;
};

runtimeConfig.getOssDomain = function() {
  return runtimeConfig.ossDomain;
};

runtimeConfig.applyStoredClientRuntimeConfig();

export default runtimeConfig;
