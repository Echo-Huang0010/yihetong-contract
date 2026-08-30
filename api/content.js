import request from '@/utils/request.js';

/**
 * 获取服务类型列表
 */
export function getServiceTypeList() {
  return request({
    url: '/v1/service/type/list',
    method: 'GET'
  });
}

/**
 * 获取服务类型详情
 * @param {Number} id 服务类型ID
 */
export function getServiceTypeDetail(id) {
  return request({
    url: `/v1/service/type/${id}`,
    method: 'GET'
  });
}

/**
 * 申请服务
 * @param {Object} data 申请服务参数
 * @param {Number} data.serviceTypeId 服务类型ID
 * @param {String} data.name 申请人姓名
 * @param {String} data.mobile 申请人手机号
 * @param {String} data.description 问题描述（可选）
 */
export function applyService(data) {
  return request({
    url: '/v1/service/apply',
    method: 'POST',
    data
  });
}

/**
 * 获取文书分类树
 * @returns {Promise} 返回文书分类树数据
 */
export function getDocumentCategoryTree() {
  return request({
    url: '/v1/document/category/tree',
    method: 'GET'
  });
}

/**
 * 根据一级分类获取文书模板列表（分组展示）
 * @param {Number} topCategoryId 一级分类ID
 * @returns {Promise} 返回文书模板列表数据
 */
export function getDocumentGroups(topCategoryId) {
  return request({
    url: '/v1/document/group',
    method: 'GET',
    data: { topCategoryId }
  });
}

/**
 * 获取文书详情
 * @param {Number} id 文书ID
 * @returns {Promise} 返回文书详情数据
 */
export function getDocumentDetail(id) {
  return request({
    url: `/v1/document/${id}`,
    method: 'GET'
  });
}

/**
 * 记录文书下载
 * @param {Number} id 文书ID
 * @returns {Promise} 返回记录结果
 */
export function recordDocumentDownload(id) {
  return request({
    url: `/v1/document/${id}/download`,
    method: 'GET'
  });
}

/**
 * Authorize and obtain a short-lived document download URL. The server also
 * records the download and user-document relation atomically.
 */
export function getDocumentDownloadUrl(id) {
  return request({
    url: `/v1/document/${id}/download`,
    method: 'GET'
  });
}

/**
 * 获取用户文书列表
 * @param {Object} params 查询参数
 * @param {Number} params.pageNo 页码
 * @param {Number} params.pageSize 每页数量
 * @returns {Promise} 返回用户文书列表数据
 */
export function getUserDocumentList(params) {
  return request({
    url: '/v1/document/user/list',
    method: 'GET',
    data: params
  });
}

/**
 * 获取用户文书详情
 * @param {Number} id 用户文书ID
 * @returns {Promise} 返回用户文书详情数据
 */
export function getUserDocumentDetail(id) {
  return request({
    url: `/v1/document/user/${id}`,
    method: 'GET'
  });
}
