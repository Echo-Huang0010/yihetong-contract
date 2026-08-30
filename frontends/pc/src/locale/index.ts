/*
 * @Description:
 * @LastEditTime: 2023-03-17 14:45:47
 * @LastEditors: 何俊峰
 * @Author: 何俊峰
 * @Date: 2023-02-24 17:34:15
 */
import { createI18n } from 'vue-i18n';
import en from './en-US';
import cn from './zh-CN';

export const LOCALE_OPTIONS = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];
const defaultLocale = localStorage.getItem('arco-locale') || 'zh-CN';

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: 'en-US',
  allowComposition: true,
  silentFallbackWarn: true,
  silentTranslationWarn: true,
  messages: {
    'en-US': en,
    'zh-CN': cn,
  },
});

export default i18n;
