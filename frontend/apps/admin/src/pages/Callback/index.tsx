import React, { useEffect, useState } from "react";
import { App as AntdApp, Result, Button, Spin } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { casdoorLogin, setToken } from "@zero/api";
import { parseCasdoorCallback } from "@zero/shared";

export const CallbackPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { code, state } = parseCasdoorCallback(location.search);
    if (!code) {
      setError("未获取到有效的 Casdoor 授权码 (code)");
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await casdoorLogin({ code, state: state || undefined });
        if (!isMounted) return;
        setToken(res.accessToken);
        message.success(`SSO 登录成功，欢迎回来：${res.realName || res.username}！`);
        navigate("/dashboard", { replace: true });
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Casdoor SSO 登录校验失败，请重试");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate, message]);

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
        正在通过 Casdoor 验证企业身份凭据，请稍候...
      </div>
    </div>
  );
};

export default CallbackPage;
