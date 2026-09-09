import React from "react";
import { Tooltip } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useLayoutSettings } from "../../contexts/LayoutSettingsContext";
import { useIntl } from "../../contexts/LocaleContext";

export const ThemeSwitch: React.FC = () => {
  const { isDark, toggleNavTheme } = useLayoutSettings();
  const { formatMessage } = useIntl();

  return (
    <Tooltip
      title={
        isDark
          ? formatMessage({
              id: "portal.header.theme.light",
              defaultMessage: "切换为浅色模式",
            })
          : formatMessage({
              id: "portal.header.theme.dark",
              defaultMessage: "切换为暗黑模式",
            })
      }
    >
      <span
        style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
        onClick={toggleNavTheme}
      >
        {isDark ? <SunOutlined /> : <MoonOutlined />}
      </span>
    </Tooltip>
  );
};

export default ThemeSwitch;