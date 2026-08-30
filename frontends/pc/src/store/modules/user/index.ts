/*
 * @Description:
 * @LastEditTime: 2024-02-04 18:01:43
 * @LastEditors: wudi
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import { defineStore } from 'pinia';
import {
  login as userLogin,
  passLogin,
  logout as userLogout,
  getUserInfo,
  switchRole,
  LoginData,
} from '@/api/user';
import {
  setToken,
  clearToken,
  getRole,
  setRole,
  clearRole,
} from '@/utils/auth';
import { removeRouteListener } from '@/utils/route-listener';
import { useRouter } from 'vue-router';
import { UserState } from './types';
import useAppStore from '../app';

const router = useRouter();

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    nickname: '',
    avatarUrl: '',
    phone: '',
    companyName: '',
    companyId: '',
    role: 'admin',
    roles: getRole() || 'user',
    companyMealCount: 0,
    individualMealCount: 0,
  }),

  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
  },

  actions: {
    async switchRoles(role: any, data: any) {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        const res = await switchRole(data);
        this.info(resolve);
      });
    },
    // Set user's information
    setInfo(partial: Partial<UserState>) {
      console.log(partial);
      this.$patch(partial);
    },

    // Reset user's information
    resetInfo() {
      this.$reset();
    },

    // Get user's information
    async info(
      resolve?: { (value: unknown): void; (arg0: string): any } | undefined
    ) {
      const res = await getUserInfo();
      this.roles = res.data.identityType ? 'admin' : 'user';
      console.log(1111111111);
      console.log(res.data.admin);
      console.log(this.roles);
      setRole(this.roles);
      setToken(res.data.token);
      this.setInfo(res.data);
      if (resolve) {
        resolve('切换成功');
      }
    },

    // 手机验证码登录
    async login(loginForm: LoginData) {
      try {
        const res = await userLogin(loginForm);
        if (!res.data.authentication) {
          clearToken();
          clearRole();
          return res;
        }
        this.roles = res.data.admin ? 'admin' : 'user';
        setRole(this.roles);
        setToken(res.data.token);
        return res;
      } catch (err) {
        clearToken();
        clearRole();
        throw err;
      }
    },
    // 账号密码登录
    async passLogin(loginForm: LoginData) {
      try {
        const res = await passLogin(loginForm);
        if (!res.data.authentication) {
          clearToken();
          clearRole();
          return res;
        }
        setToken(res.data.token);
        this.roles = 'user';
        setRole('user');
        return res;
      } catch (err) {
        clearToken();
        clearRole();
        throw err;
      }
    },
    logoutCallBack() {
      const appStore = useAppStore();
      this.resetInfo();
      clearToken();
      clearRole();
      removeRouteListener();
      appStore.clearServerMenu();
    },
    // Logout
    async logout() {
      this.logoutCallBack();
    },
  },
});

export default useUserStore;
