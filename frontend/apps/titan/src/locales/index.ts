import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import zhTW from 'antd/locale/zh_TW';
import type { Locale as AntdLocale } from 'antd/es/locale';

import zhCNMessages from './zh-CN';
import enUSMessages from './en-US';
import zhTWMessages from './zh-TW';

export type LocaleKey = 'zh-CN' | 'en-US' | 'zh-TW';

export interface LocaleConfig {
  key: LocaleKey;
  label: string;
  icon: string;
  antdLocale: AntdLocale;
  messages: Record<string, string>;
}

export const LOCALES: Record<LocaleKey, LocaleConfig> = {
  'zh-CN': {
    key: 'zh-CN',
    label: '简体中文',
    icon: '🇨🇳',
    antdLocale: zhCN,
    messages: zhCNMessages,
  },
  'en-US': {
    key: 'en-US',
    label: 'English',
    icon: '🇺🇸',
    antdLocale: enUS,
    messages: enUSMessages,
  },
  'zh-TW': {
    key: 'zh-TW',
    label: '繁體中文',
    icon: '🇭🇰',
    antdLocale: zhTW,
    messages: zhTWMessages,
  },
};

export const DEFAULT_LOCALE: LocaleKey = 'zh-CN';
