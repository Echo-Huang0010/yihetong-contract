/*
 * @Description:
 * @LastEditTime: 2023-12-15 16:47:02
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-11-27 17:23:35
 */
import axios from 'axios';
import { Message } from '@arco-design/web-vue';

function uploadFileOss(fileName: any, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    axios({
      url: '/mgt/upload',
      method: 'get',
      data: 999, // 代表拦截器不加/api
    }).then((res: any) => {
      if (data) {
        const oss = res.data || res;
        const key = `open/admin${fileName}`;
        const formData = new FormData();
        formData.append('policy', oss.policy);
        formData.append('key', key);
        formData.append('OSSAccessKeyId', oss.accessKeyId);
        formData.append('signature', oss.signature);
        if (oss.securityToken) {
          formData.append('x-oss-security-token', oss.securityToken);
        }
        formData.append('bucketName', oss.bucketName);
        formData.append('file', data);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', oss.host, true);
        xhr.onload = () => {
          if (xhr.status === 204) {
            resolve(`${oss.host}/${key}`.replace('http://', 'https://'));
          } else {
            Message.error('上传失败');
            resolve(null);
          }
        };
        xhr.onerror = () => {
          Message.error('上传失败');
          resolve(null);
        };
        xhr.send(formData);
      } else {
        Message.error('文件获取失败');
        resolve(null);
      }
    });
  });
}
// eslint-disable-next-line import/prefer-default-export
export { uploadFileOss };
