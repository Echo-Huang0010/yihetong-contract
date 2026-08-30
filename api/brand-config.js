import request from '@/utils/request.js';

export function getBrandConfig(options = {}) {
  return request({
    url: '/v1/brand-config/active',
    method: 'GET',
    silent: options.silent === true,
  });
}

export function getClientConfig(options = {}) {
  return request({
    url: '/v1/client-config',
    method: 'GET',
    silent: options.silent === true,
  });
}
