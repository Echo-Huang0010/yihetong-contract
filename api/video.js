import request from '@/utils/request.js';
import config from '@/config/index.js';
import store from '../store/index.js';

function uploadVideoToOss(file) {
  const videoFile = typeof file === 'string' ? { path: file } : (file || {});
  const filePath = videoFile.path || videoFile.tempFilePath;
  if (!filePath) {
    return Promise.reject(new Error('video file path is empty'));
  }
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: config.getBaseUrl() + '/upload/v1/video',
      filePath,
      name: 'file',
      dataType: 'json',
      header: {
        'x-access-token': store.state.token,
      },
      success: (uploadFileRes) => {
        let data = uploadFileRes.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (error) {
            reject(error);
            return;
          }
        }
        if (data && (data.flag || data.code === 0) && data.data) {
          resolve(data.data);
          return;
        }
        reject(new Error((data && data.message) || '视频上传失败'));
      },
      fail: reject,
    });
  });
}

const videoApi = {
  check(contractId) {
    return request({
      url: `/v1/contract-video/check/${contractId}`,
      method: 'GET',
    });
  },
  upload(data) {
    return request({
      url: '/v1/contract-video/upload',
      method: 'POST',
      data,
    });
  },
  list(contractId) {
    return request({
      url: `/v1/contract-video/list/${contractId}`,
      method: 'GET',
    });
  },
  uploadVideoToOss,
};

export default videoApi;
