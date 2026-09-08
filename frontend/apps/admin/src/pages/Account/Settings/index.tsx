import React, { useState, useEffect } from "react";
import { Card, Tabs } from "antd";
import { PageContainer } from "@ant-design/pro-components";
import { UserOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useIntl } from "../../../contexts/LocaleContext";
import { BaseView } from "./BaseView";
import { SecurityView } from "./SecurityView";

export const AccountSettings: React.FC = () => {
  const { formatMessage } = useIntl();
  const [tabPlacement, setTabPlacement] = useState<"start" | "top">("start");

  useEffect(() => {
    const handleResize = () => {
      setTabPlacement(window.innerWidth < 768 ? "top" : "start");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabItems = [
    {
      key: "base",
      label: (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          基本设置
        </span>
      ),
      children: <BaseView />,
    },
    {
      key: "security",
      label: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          安全设置
        </span>
      ),
      children: <SecurityView />,
    },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "menu.account.settings", defaultMessage: "个人设置" }),
        subTitle: "管理当前登录员工的个人基本资料、密码安全防护与系统会话",
      }}
    >
      <Card variant="borderless" styles={{ body: { padding: "16px 24px" } }}>
        <Tabs
          defaultActiveKey="base"
          tabPlacement={tabPlacement}
          items={tabItems}
          style={{ minHeight: 450 }}
        />
      </Card>
    </PageContainer>
  );
};

export default AccountSettings;
