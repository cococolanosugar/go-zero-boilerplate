import React, { useState } from "react";
import { App as AntdApp, Button, Divider } from "antd";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { LockOutlined, UserOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { adminLogin, setToken } from "@zero/api";
import { buildCasdoorAuthUrl } from "@zero/shared";
import { useInitialState } from "../../contexts/InitialStateContext";
import { useAuth } from "../../contexts/AuthContext";

export const LoginPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { refreshInitialState } = useInitialState();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const res = await adminLogin({
        account: values.account,
        password: values.password,
      });
      setToken(res.accessToken);
      await Promise.allSettled([refreshInitialState(), refreshProfile()]);
      message.success(`欢迎回来，${res.realName || res.username || "工程师"}！`);

      const searchParams = new URLSearchParams(location.search);
      const queryFrom = searchParams.get("from");
      const stateFrom = (location.state as any)?.from;
      const statePath = typeof stateFrom === "string"
        ? stateFrom
        : stateFrom?.pathname
          ? `${stateFrom.pathname}${stateFrom.search || ""}`
          : undefined;
      const from = statePath || queryFrom || "/pipelines";
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err.message || "登录失败，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  const handleCasdoorLogin = () => {
    const callbackUrl = `${window.location.origin}/callback`;
    window.location.href = buildCasdoorAuthUrl({ redirectUri: callbackUrl });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 50%, #f6ffed 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LoginForm
        title="Titan 研发交付平台"
        subTitle="云原生持续交付、Kubernetes 多环境发布与 CI/CD 流水线调度中枢"
        logo="/favicon.svg"
        loading={loading}
        initialValues={{
          account: "admin",
          password: "123456",
        }}
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText: "登录 Titan 工作台",
          },
          submitButtonProps: {
            size: "large",
            style: { width: "100%" },
          },
        }}
      >
        <ProFormText
          name="account"
          fieldProps={{
            size: "large",
            prefix: <UserOutlined style={{ color: "#1677ff" }} />,
          }}
          placeholder="请输入研发账号 / 邮箱"
          rules={[{ required: true, message: "请输入账号" }]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: "large",
            prefix: <LockOutlined style={{ color: "#1677ff" }} />,
          }}
          placeholder="请输入登录密码"
          rules={[{ required: true, message: "请输入密码" }]}
        />

        <Divider plain style={{ margin: "16px 0 24px" }}>
          第三方统一认证 (SSO)
        </Divider>

        <Button
          block
          size="large"
          icon={<SafetyCertificateOutlined style={{ color: "#52c41a" }} />}
          onClick={handleCasdoorLogin}
        >
          使用 Casdoor 企业 SSO 快速登录
        </Button>
      </LoginForm>
    </div>
  );
};

export default LoginPage;
