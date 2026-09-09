import React from "react";
import { DefaultFooter } from "@ant-design/pro-components";
import { GithubOutlined } from "@ant-design/icons";
import { APP_NAME } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";

export const Footer: React.FC = () => {
  const { formatMessage } = useIntl();

  const copyrightText = `2026 ${APP_NAME} ${formatMessage({
    id: "portal.footer.copyright",
    defaultMessage: "工业级微服务门户体系",
  })}`;

  return (
    <DefaultFooter
      copyright={copyrightText}
      links={[
        {
          key: "go-zero",
          title: "go-zero 微服务",
          href: "https://go-zero.dev",
          blankTarget: true,
        },
        {
          key: "github",
          title: <GithubOutlined />,
          href: "https://github.com/zeromicro/go-zero",
          blankTarget: true,
        },
        {
          key: "admin",
          title: "管理后台 (:3001)",
          href: "http://localhost:3001",
          blankTarget: true,
        },
        {
          key: "Ant Design",
          title: "Ant Design 6.6.2",
          href: "https://ant.design",
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;