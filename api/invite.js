/**
 * 邀请用户功能的API接口
 */

// 导入项目的request工具
import request from '@/utils/request.js';

// API基础路径（不需要包含baseUrl，request工具会自动添加）
const API_PATH = '/distributor/v1';

/**
 * 获取用户分销相关信息
 * 返回邀请码、待提现金额、已提现金额
 */
export function getDistributorInfo() {
  return request({
    url: API_PATH,
    method: 'GET'
  });
}

/**
 * 获取用户佣金信息(交易列表)
 * @param {Object} params 查询参数
 * @param {number} params.pageNo 页码
 * @param {number} params.pageSize 每页大小
 */
export function getCommissionList(params) {
  return request({
    url: `${API_PATH}/commission`,
    method: 'GET',
    data: params
  });
}

/**
 * 获取合同份额记录
 * @param {Object} params 查询参数
 * @param {number} params.pageNum 页码
 * @param {number} params.pageSize 每页大小
 */
export function getShareRecords(params) {
  return request({
    url: `${API_PATH}/share-records`,
    method: 'GET',
    data: params
  });
}

/**
 * 获取合同分配记录
 * @param {Object} params 查询参数
 * @param {number} params.current 页码
 * @param {number} params.pageSize 每页大小
 */
export function getDispatchContractRecords(params) {
  return request({
    url: `${API_PATH}/dispatch-contract-record`,
    method: 'GET',
    data: params
  });
}

/**
 * 提现
 * @param {Object} params 提现参数
 * @param {number} params.amount 提现金额，单位：分
 * @param {string} params.url 转账图片地址
 */
export function withdraw(params) {
  return request({
    url: `${API_PATH}/withdraw`,
    method: 'POST',
    data: params
  });
}

/**
 * 获取用户提现申请记录
 * @param {Object} params 查询参数
 * @param {number} params.pageNo 页码
 * @param {number} params.pageSize 每页大小
 */
export function getWithdrawHistory(params) {
  return request({
    url: `${API_PATH}/withdraw`,
    method: 'GET',
    data: params
  });
}

/**
 * 获取合同总数和已分配份额信息
 * 返回合同总数和已分配份额
 */
export function getContractSummary() {
  return request({
    url: `${API_PATH}/contract-summary`,
    method: 'GET'
  });
}

/**
 * 向下级分配合同
 * @param {Object} data 分配数据
 * @param {number} data.sourceUserId 当前用户ID
 * @param {number} data.targetUserId 目标用户ID
 * @param {number} data.targetCompanyId 目标企业ID (targetContractType为c时必传)
 * @param {string} data.targetContractType 合同类型 p:个人 c:企业
 * @param {number} data.contractNum 合同数量
 */
export function dispatchContract(data) {
  return request({
    url: `${API_PATH}/dispatch-contract`,
    method: 'PUT',
    data
  });
}

/**
 * 获取分享用户数据列表
 * 返回直接下级及其下级用户
 */
export function getLowerUsers() {
  return request({
    url: `${API_PATH}/lower-users`,
    method: 'GET'
  });
}

/**
 * 格式化提现状态
 * @param {number} status 状态码 0:申请中，1:已提现，-1: 驳回
 * @returns {string} 格式化后的状态文本
 */
export function formatWithdrawStatus(status) {
  const statusMap = {
    '0': '申请中',
    '1': '已提现',
    '-1': '已驳回'
  };
  return statusMap[status] || '未知状态';
}

/**
 * 格式化工具函数
 */

/**
 * 格式化金额 (分 -> 元)
 * @param {number} amount 金额，单位：分
 * @returns {string} 格式化后的金额，单位：元
 */
export function formatAmount(amount) {
  const num = parseFloat(amount) || 0;
  return (num / 100).toFixed(2);
}

/**
 * 格式化手机号，中间4位用****代替
 * @param {string} phone 手机号
 * @returns {string} 格式化后的手机号
 */
export function formatPhone(phone) {
  if (!phone) return '未知用户';
  if (phone.length !== 11) return phone;
  return phone.substr(0, 3) + '****' + phone.substr(7);
}

/**
 * 格式化时间戳为年-月-日 时:分格式
 * @param {string|number} timestamp 时间戳
 * @returns {string} 格式化后的时间
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  
  let date;
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) return timestamp;
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  const formatNumber = n => n < 10 ? '0' + n : n;
  
  return `${year}-${formatNumber(month)}-${formatNumber(day)} ${formatNumber(hour)}:${formatNumber(minute)}`;
}

/**
 * 计算总交易金额
 * @param {Array} list 交易列表数据
 * @returns {number} 总金额，单位：分
 */
export function getTotalAmount(list) {
  if (!list || list.length === 0) return 0;
  return list.reduce((total, item) => total + (item.orderAmount || 0), 0);
}

/**
 * 获取小程序码
 * @param {string} inviteCode 邀请码
 * @returns {Promise<string>} 返回小程序码图片的URL
 */
export function getWxaCode() {
  return request({
    url: `/u/wxacode`,
    method: 'GET'
  });
}
