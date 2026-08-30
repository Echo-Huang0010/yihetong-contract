/*
 * @Author: wudi
 * @Date: 2023-08-29 09:44:38
 * @LastEditors: wudi
 * @LastEditTime: 2023-09-13 09:47:10
 * @Description:
 */
import request from '@/utils/request.js';
export function list(data) {
  // 文件列表
  return request({
    url: `/v2/attachment`,
    method: 'GET',
    data,
  });
}
export function create(data) {
  // 用户新增文件
  return request({
    url: `/v2/attachment`,
    method: 'POST',
    data,
  });
}

export function remove(data) {
  // 删除文件
  return request({
    url: `/v2/attachment?id=` + data.id,
    method: 'DELETE',
  });
}

// AI生成合同
export function aiGenerateContract(data) {
  return request({
    url: `/ai/chat`,
    method: 'POST',
    data,
  });
}

// 生成合同文档(PDF)
export function generateContract(data) {
  return request({
    url: `/ai/generate-contract`,
    method: 'POST',
    data,
  });
}

// 生成合同文档(Word)
export function generateWordContract(data) {
  return request({
    url: `/ai/generate-word-contract`,
    method: 'POST',
    data,
  });
}

export function templateList(data, options = {}) {
  // 签署模板列表
  return request({
    url: `/v1/contract/template`,
    method: 'GET',
    data,
    ...options,
  });
}

export function recommendedTemplateList(data, options = {}) {
  // 首页推荐签署模板
  return request({
    url: `/v1/contract/template/recommended`,
    method: 'GET',
    data,
    ...options,
  });
}

export function templateDetail(templateId) {
  // 签署模板详情
  return request({
    url: `/v1/contract/template/${templateId}`,
    method: 'GET',
  });
}
export function templateCategory(templateId) {
  // 模板分类列表
  return request({
    url: `/v1/contract/template/category/list`,
    method: 'GET',
  });
}

export function createByTemplate(templateId) {
  // 基于合同模板发起合同签署
  return request({
    url: `/v5/contract/create-by-template`,
    method: 'GET',
  });
}

export function addTempStorage(data) {
  // 临时存储通过模板发起合同参数
  return request({
    url: `/v1/contract/template/temp-storage`,
    method: 'POST',
    data
  });
}
export function imagesToPdf(data) {
  // 图片转pdf
  return request({
    url: `/v1/contract-tools/images-to-pdf`,
    method: 'POST',
    data
  });
}

// 合同审查
export function auditDocument(data) {
  return request({
    url: `/ai/audit-document`,
    method: 'POST',
    data,
  });
}

// 合同比对
export function compareContracts(data) {
  return request({
    url: `/ai/contract-compare`,
    method: 'POST',
    data,
  });
}

export function contractCompareHistory(data, options = {}) {
  return request({
    url: `/ai/contract-compare`,
    method: 'GET',
    data,
    silent: options.silent === true,
  });
}
