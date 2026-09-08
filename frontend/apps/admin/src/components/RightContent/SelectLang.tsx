import React from "react";
import { Dropdown, Space, Tooltip } from "antd";
import { TranslationOutlined } from "@ant-design/icons";
import { useLocale, useIntl } from "../../contexts/LocaleContext";
import { LOCALES } from "../../locales";

export const SelectLang: React.FC = () => {
  const { locale, setLocale } = useLocale();
  const { formatMessage } = useIntl();

  return (
    <Dropdown
      menu={{
        selectedKeys: [locale],
        items: Object.values(LOCALES).map((item) => ({
          key: item.key,
          label: (
            <Space>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Space>
          ),
          onClick: () => setLocale(item.key),
        })),
      }}
    >
      <span style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}>
        <Tooltip title={formatMessage({ id: "navBar.lang", defaultMessage: "语言选择" })}>
          <TranslationOutlined />
        </Tooltip>
      </span>
    </Dropdown>
  );
};

export default SelectLang;
