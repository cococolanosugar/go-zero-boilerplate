import type { ProSettings } from "@ant-design/pro-components";
import { APP_NAME } from "@zero/shared";

export interface PortalDefaultSettings extends ProSettings {
  pwa?: boolean;
  logo?: string;
  title?: string;
}

/**
 * 门户全局默认品牌与布局配置（对齐 Ant Design Pro 规范）
 */
export const defaultSettings: PortalDefaultSettings = {
  navTheme: "light",
  colorPrimary: "#722ed1",
  layout: "top",
  contentWidth: "Fluid",
  fixedHeader: true,
  fixSiderbar: false,
  splitMenus: false,
  title: `${APP_NAME} 官方技术门户`,
  pwa: false,
};

export default defaultSettings;
