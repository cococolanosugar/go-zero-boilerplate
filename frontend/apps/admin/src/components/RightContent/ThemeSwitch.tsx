import React from "react";
import { Tooltip } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useLayoutSettings } from "../../contexts/LayoutSettingsContext";
import { useIntl } from "../../contexts/LocaleContext";

export interface ThemeSwitchProps {
  isDark?: boolean;
  toggleNavTheme?: () => void;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = (props) => {
  const layoutCtx = useLayoutSettings();
  const { formatMessage } = useIntl();

  const isDark = props.isDark !== undefined ? props.isDark : layoutCtx.isDark;
  const toggle = props.toggleNavTheme || layoutCtx.toggleNavTheme;

  return (
    <Tooltip
      title={
        isDark
          ? formatMessage({ id: "navBar.theme.light", defaultMessage: "切换为浅色模式" })
          : formatMessage({ id: "navBar.theme.dark", defaultMessage: "切换为暗黑模式" })
      }
    >
      <span
        style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
        onClick={toggle}
      >
        {isDark ? <SunOutlined /> : <MoonOutlined />}
      </span>
    </Tooltip>
  );
};

export default ThemeSwitch;
