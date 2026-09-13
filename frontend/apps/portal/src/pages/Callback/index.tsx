import React, { useEffect, useState, useRef } from "react";
import { App as AntdApp, Result, Button, Spin } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { casdoorLogin, setToken } from "@zero/api";
import { parseCasdoorCallback } from "@zero/shared";
import { useAuth } from "../../contexts/AuthContext";
import { useIntl } from "../../contexts/LocaleContext";

export const CallbackPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { refreshProfile } = useAuth();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const { code, state } = parseCasdoorCallback(location.search);
    if (!code) {
      setError("未获取到有效的 Casdoor 授权码 (code)");
      return;
    }

    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;

    (async () => {
      try {
        const res = await casdoorLogin({ code, state: state || undefined });
        setToken(res.accessToken);
        await refreshProfile();
        message.success(
          formatMessage(
            {
              id: "login.success.casdoor",
              defaultMessage: `SSO 登录成功，欢迎回来：{name}！`,
            },
            { name: res.realName || res.username || "企业员工" }
          )
        );
        navigate("/home", { replace: true });
      } catch (err: any) {
        setError(err.message || "Casdoor SSO 登录校验失败，请重试");
      }
    })();
  }, [location.search, navigate, message, refreshProfile, formatMessage]);

  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f0f2f5",
        }}
      >
        <Result
          status="error"
          title={formatMessage({
            id: "sso.error.title",
            defaultMessage: "SSO 认证失败",
          })}
          subTitle={error}
          extra={[
            <Button
              type="primary"
              key="home"
              onClick={() => navigate("/home", { replace: true })}
            >
              {formatMessage({
                id: "sso.error.backHome",
                defaultMessage: "返回门户首页",
              })}
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5",
      }}
    >
      <Spin size="large" />
      <div style={{ marginTop: 24, fontSize: 16, color: "#595959" }}>
        {formatMessage({
          id: "sso.callback.verifying",
          defaultMessage: "正在通过 Casdoor 验证企业身份凭据，请稍候...",
        })}
      </div>
    </div>
  );
};

export default CallbackPage;
