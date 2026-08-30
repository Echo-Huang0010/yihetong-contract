/*
 * @Description:
 * @LastEditTime: 2023-12-15 13:55:40
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-06-05 18:17:37
 */
/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module 'quill-image-uploader';
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_MANAGE_ADMIN_URL?: string;
  readonly VITE_H5_BASE_URL?: string;
}
