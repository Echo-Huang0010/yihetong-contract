/* eslint-disable no-shadow */
/*
 * @Description:
 * @LastEditTime: 2023-12-14 10:25:57
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { useUserStore } from '@/store';
import { getToken } from '@/utils/auth';
import defaultSettings from '@/config/settings.json';

interface commonList {
  [index: number]: any;
}
export interface HttpResponse<T = unknown> {
  [x: string]: any | commonList;
}

declare module 'axios' {
  interface AxiosResponse<T = any, D = any> {
    [x: string]: any | commonList;
    // 这里追加你的参数
  }
  export function create(config?: AxiosRequestConfig): AxiosInstance;
}
if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // let each request carry token
    // this example using the JWT token
    // x-access-token is a custom headers key
    // please modify it according to the actual situation
    const token = getToken();
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers[defaultSettings.business.tokenName] = `${token}`;
    }
    return config;
  },
  (error) => {
    // do something
    return Promise.reject(error);
  }
);
// add response interceptors
axios.interceptors.response.use(
  async (response: AxiosResponse<HttpResponse>) => {
    const res = response.data;
    if (response.config.responseType === 'blob') {
      return res;
    }
    // if the custom code is not 20000, it is judged as an error.
    // if (res.code !== 0) {
    if (res.code && res.code !== defaultSettings.business?.normalCode) {
      if (res.code === 40240001) {
        Message.error({
          content: res.message || 'Error',
          duration: 5 * 1000,
        });
        // defaultSettings.business?.tokenExpire: token过期码
        if (
          [defaultSettings.business?.tokenExpire].includes(res.code) &&
          response.config.url !== defaultSettings.business?.sendCodeUrl
        ) {
          // Modal.error({
          //   title: '温馨提示',
          //   content: '您已注销，您可以取消以留在此页面，也可以重新登录',
          //   okText: '重新登录',
          //   async onOk() {
          const userStore = useUserStore();

          await userStore.logout();
          // window.location.reload();
          //   },
          // });
        }
      } else {
        Message.error({
          content: res.message || 'Request Error',
          duration: 5 * 1000,
        });
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return response.data;
  },
  (error) => {
    Message.error({
      content: error.message || 'Request Error',
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  }
);
