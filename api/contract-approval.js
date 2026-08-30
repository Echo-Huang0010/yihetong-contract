import request from '@/utils/request.js';

export function approvalConfig(templateId, options = {}) {
  return request({
    url: `/v1/contract-approval/template/${templateId}/config`,
    method: 'GET',
    silent: options.silent === true,
  });
}

export function approvalMine(data = {}) {
  return request({
    url: `/v1/contract-approval/mine`,
    method: 'GET',
    data,
  });
}

export function approvalDetail(id) {
  return request({
    url: `/v1/contract-approval/${id}`,
    method: 'GET',
  });
}

export function continueApproval(id) {
  return request({
    url: `/v1/contract-approval/${id}/continue`,
    method: 'POST',
  });
}
