import React from "react";
import { Button, Tooltip } from "antd";
import {
  ExportOutlined,
  QuestionCircleOutlined,
  GithubOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { SelectLang } from "./SelectLang";
import { ThemeSwitch } from "./ThemeSwitch";
import { HeaderSearch } from "../HeaderSearch";
import { useIntl } from "../../contexts/LocaleContext";

export interface RightContentActionsProps {
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

export const RightContentActions: React.FC<RightContentActionsProps> = ({
  isLoggedIn,
  onOpenLogin,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <HeaderSearch />
      <SelectLang />
      <ThemeSwitch />
      <Tooltip
        title={formatMessage({
          id: "portal.header.admin.tooltip",
          defaultMessage: "前往企业管理后台系统 (:3001)",
        })}
      >
        <Button
          type="dashed"
          size="small"
          icon={<ExportOutlined />}
          onClick={() => window.open("http://localhost:3001", "_blank")}
        >
          {formatMessage({
            id: "portal.header.admin",
            defaultMessage: "管理后台",
          })}
        </Button>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "portal.header.docs",
          defaultMessage: "查看微服务设计指南",
        })}
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() => window.open("https://go-zero.dev", "_blank")}
        >
          <QuestionCircleOutlined />
        </span>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "portal.header.github",
          defaultMessage: "访问 GitHub 源码大仓",
        })}
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() =>
            window.open("https://github.com/zeromicro/go-zero", "_blank")
          }
        >
          <GithubOutlined />
        </span>
      </Tooltip>
      {!isLoggedIn && (
        <Button
          type="primary"
          shape="round"
          size="small"
          icon={<UserOutlined />}
          style={{ background: "#722ed1", borderColor: "#722ed1", marginLeft: 4 }}
          onClick={onOpenLogin}
        >
          {formatMessage({
            id: "portal.header.login",
            defaultMessage: "登录账号",
          })}
        </Button>
      )}
    </div>
  );
};

export default RightContentActions;