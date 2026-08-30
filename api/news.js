import request from '@/utils/request.js';

// 获取企业服务列表
export function getNewsList(data, options = {}) {
  return request({
    url: '/app/v1/news/content/list',
    method: 'GET',
    data,
    silent: options.silent === true
  });
}

// 获取企业服务详情
export function getNewsDetail(id) {
  return request({
    url: `/app/v1/news/content/${id}`,
    method: 'GET'
  });
}

// 获取内容文书服务列表
export function getContentList(data) {
  return request({
    url: '/app/v1/news/content/list',
    method: 'GET',
    data
  });
}

// 获取内容文书服务详情
export function getContentDetail(id) {
  return request({
    url: `/app/v1/news/content/${id}`,
    method: 'GET'
  });
}

// 下载文书
export function downloadDocument(id) {
  return request({
    url: `/app/v1/news/document/${id}/download`,
    method: 'GET'
  });
}

// 提交服务申请
export function submitService(data) {
  return request({
    url: '/app/v1/news/service/submit',
    method: 'POST',
    data
  });
} 
