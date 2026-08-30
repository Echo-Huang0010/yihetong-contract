import type { RouteRecordNormalized } from 'vue-router';

interface business {
  [x: string]: any;
}
export interface AppState {
  business: business;
  theme: string;
  colorWeak: boolean;
  navbar: boolean;
  menu: boolean;
  topMenu: boolean;
  hideMenu: boolean;
  menuCollapse: boolean;
  footer: boolean;
  themeColor: string;
  menuWidth: number;
  globalSettings: boolean;
  device: string;
  tabBar: boolean;
  brandConfigLoaded: boolean;
  runtimeConfig: Record<string, unknown>;
  menuFromServer: boolean;
  serverMenu: RouteRecordNormalized[];
  [key: string]: unknown;
}
