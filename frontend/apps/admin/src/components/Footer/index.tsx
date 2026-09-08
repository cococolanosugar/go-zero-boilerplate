import React from "react";
import { DefaultFooter } from "@ant-design/pro-components";
import { GithubOutlined, BookOutlined } from "@ant-design/icons";
import { APP_NAME } from "@zero/shared";
import { useIntl } from "../../contexts/LocaleContext";

export const Footer: React.FC = () => {
  const { formatMessage } = useIntl();

  const defaultTitle = formatMessage({
    id: "app.copyright.produced",
    defaultMessage: `2026 ${APP_NAME} 工业级全栈 Monorepo`,
  });

  return (
    <DefaultFooter
      copyright={defaultTitle}
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
          key: "ant-design",
          title: "Ant Design 6.6.2",
          href: "https://ant.design",
          blankTarget: true,
        },
        {
          key: "docs",
          title: (
            <span>
              <BookOutlined style={{ marginRight: 4 }} />
              架构设计文档
            </span>
          ),
          href: "https://pro.ant.design",
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
