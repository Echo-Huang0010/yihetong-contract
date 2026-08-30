/*
 * @Description:
 * @LastEditTime: 2023-05-29 17:35:50
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
export type RoleType = '' | '*' | 'admin' | 'user';
export interface UserState {
  [x: string]: any;
}
