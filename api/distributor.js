/*
 * @Description: 代理商相关API
 */
import request from '@/utils/request.js';

const distributor = {
  // 申请成为代理
  applyDistributor: data => {
    return request({
      url: `/distributor/v1/apply`,
      method: 'POST',
      data,
    });
  },
  
  // 获取代理商信息
  getDistributorInfo: () => {
    return request({
      url: `/distributor/v1/info`,
      method: 'GET',
    });
  },
  
  // 查询申请状态
  getApplyStatus: () => {
    return request({
      url: `/distributor/v1/apply/status`,
      method: 'GET',
    });
  },
  
  // 获取分销用户下的个人和企业信息
  getDistributorUserInfo: (userId) => {
    return request({
      url: `/distributor/v1/user/${userId}`,
      method: 'GET',
    });
  }
};

export default distributor; 