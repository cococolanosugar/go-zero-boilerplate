import type { ProSettings } from "@ant-design/pro-components";

export const defaultSettings: ProSettings & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: "light",
  colorPrimary: "#1677ff",
  layout: "mix",
  contentWidth: "Fluid",
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: "Titan 研发交付平台",
  pwa: false,
  logo: "/favicon.svg",
  iconfontUrl: "",
  splitMenus: false,
};

export default defaultSettings;
