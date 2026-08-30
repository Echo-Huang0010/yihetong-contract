/*
 * @Description:
 * @LastEditTime: 2023-12-14 14:11:24
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';
import defaultSettings from '@/config/settings.json';

export interface LoginData {
  phone: string;
  verificationCode?: string;
  password?: string;
}

export interface LoginRes {
  admin: any;
  token: string;
  authentication?: boolean;
}
export function login(data: LoginData) {
  return axios.post<LoginRes>(defaultSettings.business?.loginCodeUrl, data);
}
export function passLogin(data: LoginData) {
  return axios.post<LoginRes>(defaultSettings.business?.loginUrl, data);
}

export function logout() {
  return axios.post<LoginRes>('/api/user/logout');
}

export function getUserInfo() {
  return axios.get<UserState>(defaultSettings.business?.userInfoUrl);
}

export function switchRole(data: any) {
  return axios.put<LoginRes>(`/mgt/v1/u/switch-identities`, data);
}

export function getMenuList() {
  return axios.post<RouteRecordNormalized[]>('/api/user/menu');
}
