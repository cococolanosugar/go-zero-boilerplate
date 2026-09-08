import type { ProSettings } from "@ant-design/pro-components";
import { APP_NAME } from "@zero/shared";

export interface DefaultSettings extends ProSettings {
  pwa?: boolean;
  logo?: string;
  tabsLayout?: boolean;
}

/**
 * 后台系统全局默认品牌与布局配置（对齐 Ant Design Pro 规范）
 */
export const defaultSettings: DefaultSettings = {
  navTheme: "light",
  colorPrimary: "#1677ff",
  layout: "mix",
  contentWidth: "Fluid",
  fixedHeader: true,
  fixSiderbar: true,
  splitMenus: false,
  tabsLayout: true,
  title: APP_NAME,
  pwa: false,
  logo: "/logo.svg",
};

export default defaultSettings;
