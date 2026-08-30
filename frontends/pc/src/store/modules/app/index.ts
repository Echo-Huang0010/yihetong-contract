/*
 * @Description:
 * @LastEditTime: 2023-05-30 16:30:42
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-05-26 10:27:31
 */
import { defineStore } from 'pinia';
import { Notification } from '@arco-design/web-vue';
import type { NotificationReturn } from '@arco-design/web-vue/es/notification/interface';
import type { RouteRecordNormalized } from 'vue-router';
import defaultSettings from '@/config/settings.json';
import { getMenuList } from '@/api/user';
import { getBrandConfig, getClientConfig } from '@/api/brand-config';
import { AppState } from './types';

function setFavicon(icon?: string) {
  const favicon = icon || defaultSettings.business.logoIcon || defaultSettings.business.logo || '/favicon.ico';
  let link = document.querySelector<HTMLLinkElement>('#app-favicon');
  if (!link) {
    link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
  }
  if (!link) {
    link = document.createElement('link');
    link.id = 'app-favicon';
    link.rel = 'shortcut icon';
    link.type = 'image/x-icon';
    document.head.appendChild(link);
  }
  if (/\.svg($|\?)/i.test(favicon)) {
    link.type = 'image/svg+xml';
  } else if (/\.png($|\?)/i.test(favicon)) {
    link.type = 'image/png';
  } else {
    link.type = 'image/x-icon';
  }
  link.href = favicon;
}

document.title = defaultSettings.business.projectName;
setFavicon(defaultSettings.business.logoIcon || defaultSettings.business.logo);

const useAppStore = defineStore('app', {
  state: (): AppState => ({ ...defaultSettings, runtimeConfig: {} }),

  getters: {
    appCurrentSetting(state: AppState): AppState {
      return { ...state };
    },
    appDevice(state: AppState) {
      return state.device;
    },
    appAsyncMenus(state: AppState): RouteRecordNormalized[] {
      return state.serverMenu as unknown as RouteRecordNormalized[];
    },
  },

  actions: {
    // Update app settings
    updateSettings(partial: Partial<AppState>) {
      // @ts-ignore-next-line
      this.$patch(partial);
    },

    // Change theme color
    toggleTheme(dark: boolean) {
      if (dark) {
        this.theme = 'dark';
        document.body.setAttribute('arco-theme', 'dark');
      } else {
        this.theme = 'light';
        document.body.removeAttribute('arco-theme');
      }
    },
    toggleDevice(device: string) {
      this.device = device;
    },
    toggleMenu(value: boolean) {
      this.hideMenu = value;
    },
    async fetchServerMenuConfig() {
      let notifyInstance: NotificationReturn | null = null;
      try {
        notifyInstance = Notification.info({
          id: 'menuNotice', // Keep the instance id the same
          content: 'loading',
          closable: true,
        });
        const { data } = await getMenuList();
        this.serverMenu = data;
        notifyInstance = Notification.success({
          id: 'menuNotice',
          content: 'success',
          closable: true,
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        notifyInstance = Notification.error({
          id: 'menuNotice',
          content: 'error',
          closable: true,
        });
      }
    },
    clearServerMenu() {
      this.serverMenu = [];
    },
    async fetchBrandConfig() {
      try {
        const { data } = await getBrandConfig();
        if (data) {
          this.business = {
            ...this.business,
            ...data,
            projectName: data.projectName || this.business.projectName,
            companyName: data.companyName || this.business.companyName,
            logo: data.logo || this.business.logo,
            subtitle: data.subtitle || this.business.subtitle,
          };
          document.title = this.business.projectName;
          setFavicon(this.business.logoIcon || this.business.logoSquare || this.business.logo);
        }
      } catch (error) {
        document.title = this.business.projectName;
        setFavicon(this.business.logoIcon || this.business.logoSquare || this.business.logo);
      } finally {
        try {
          const { data: runtimeConfig } = await getClientConfig();
          this.runtimeConfig = runtimeConfig || {};
        } catch (error) {
          this.runtimeConfig = this.runtimeConfig || {};
        }
        this.brandConfigLoaded = true;
      }
    },
  },
});

export default useAppStore;
