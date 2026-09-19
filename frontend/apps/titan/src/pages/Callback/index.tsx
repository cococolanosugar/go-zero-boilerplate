import React, { useEffect, useState, useRef } from "react";
import { App as AntdApp, Result, Button, Spin } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { casdoorLogin, setToken } from "@zero/api";
import { parseCasdoorCallback } from "@zero/shared";
import { getErrorMessage } from "../../utils/error";
import { useInitialState } from "../../contexts/InitialStateContext";
import { useAuth } from "../../contexts/AuthContext";

export const CallbackPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { refreshInitialState } = useInitialState();
  const { refreshProfile } = useAuth();
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
        await Promise.allSettled([refreshInitialState(), refreshProfile()]);
        message.success(`SSO 登录成功，欢迎回来：${res.realName || res.username}！`);
        navigate("/pipelines", { replace: true });
      } catch (err) {
        setError(getErrorMessage(err, "Casdoor SSO 登录校验失败，请重试"));
      }
    })();
  }, [location.search, navigate, message, refreshInitialState, refreshProfile]);

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
          title="SSO 认证失败"
          subTitle={error}
          extra={[
            <Button type="primary" key="login" onClick={() => navigate("/login", { replace: true })}>
              返回常规登录
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
        正在与 Casdoor 认证中心校验授权令牌，请稍候...
      </div>
    </div>
  );
};

export default CallbackPage;
