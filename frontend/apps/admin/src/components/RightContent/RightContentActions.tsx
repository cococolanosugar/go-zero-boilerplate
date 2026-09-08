import React from "react";
import { Tooltip } from "antd";
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import { useIntl } from "../../contexts/LocaleContext";
import { SelectLang } from "./SelectLang";
import { ThemeSwitch } from "./ThemeSwitch";
import { NoticeIcon } from "./NoticeIcon";
import { HeaderSearch } from "../HeaderSearch";

export interface RightContentActionsProps {
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
  isDark?: boolean;
  toggleNavTheme?: () => void;
}

export const RightContentActions: React.FC<RightContentActionsProps> = (props) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <HeaderSearch />
      <NoticeIcon />
      <SelectLang />
      <ThemeSwitch isDark={props.isDark} toggleNavTheme={props.toggleNavTheme} />
      {props.toggleFullscreen && (
        <Tooltip
          title={
            props.isFullscreen
              ? formatMessage({ id: "navBar.fullscreen.exit", defaultMessage: "退出全屏" })
              : formatMessage({ id: "navBar.fullscreen.enter", defaultMessage: "全屏模式" })
          }
        >
          <span
            style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
            onClick={props.toggleFullscreen}
          >
            {props.isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </span>
        </Tooltip>
      )}
      <Tooltip
        title={formatMessage({
          id: "navBar.portal",
          defaultMessage: "前往官方前台门户系统 (:3000)",
        })}
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() => window.open("http://localhost:3000", "_blank")}
        >
          <GlobalOutlined />
        </span>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "navBar.help",
          defaultMessage: "查看微服务文档与使用指南",
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
          id: "navBar.github",
          defaultMessage: "查看 GitHub 仓库",
        })}
      >
        <span
          style={{ cursor: "pointer", padding: "0 8px", fontSize: 16 }}
          onClick={() => window.open("https://github.com/zeromicro/go-zero", "_blank")}
        >
          <GithubOutlined />
        </span>
      </Tooltip>
    </>
  );
};

export default RightContentActions;
