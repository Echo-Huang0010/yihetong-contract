import request from '@/utils/request.js';

/**
 * 获取推荐文书列表
 */
export function getRecommendedDocuments(options = {}) {
  return request({
    url: '/v1/document/recommended',
    method: 'get',
    silent: options.silent === true
  });
}

/**
 * 获取文书列表
 * @param {Object} params 查询参数
 */
export function getDocumentList(params) {
  return request({
    url: '/api/v1/document/list',
    method: 'get',
    data: params
  });
}

/**
 * 获取文书详情
 * @param {String|Number} id 文书ID
 */
export function getDocumentDetail(id) {
  return request({
    url: `/api/v1/document/detail/${id}`,
    method: 'get'
  });
} 
