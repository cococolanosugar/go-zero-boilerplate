import React, { useState } from "react";
import { App as AntdApp } from "antd";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { adminLogin, setToken } from "@zero/api";
import { APP_NAME } from "@zero/shared";

export const LoginPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const res = await adminLogin({
        account: values.account,
        password: values.password,
      });
      setToken(res.accessToken);
      message.success(`欢迎回来，${res.realName || res.username || "管理员"}！`);
      
      const searchParams = new URLSearchParams(location.search);
      const queryFrom = searchParams.get("from");
      const stateFrom = (location.state as any)?.from;
      const statePath = typeof stateFrom === "string"
        ? stateFrom
        : stateFrom?.pathname
          ? `${stateFrom.pathname}${stateFrom.search || ""}`
          : undefined;
      const from = statePath || queryFrom || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err.message || "登录失败，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LoginForm
        title={APP_NAME}
        subTitle="基于 go-zero 微服务网关与 Ant Design Pro 构建的企业级大仓后台"
        logo="/favicon.svg"
        loading={loading}
        initialValues={{
          account: "admin",
          password: "123456",
        }}
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText: "立即登录",
          },
        }}
      >
        <ProFormText
          name="account"
          fieldProps={{
            size: "large",
            prefix: <UserOutlined style={{ color: "#1677ff" }} />,
          }}
          placeholder="管理员账号 / 手机号（默认: admin）"
          rules={[{ required: true, message: "请输入账号或手机号" }]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: "large",
            prefix: <LockOutlined style={{ color: "#1677ff" }} />,
          }}
          placeholder="密码（默认: 123456）"
          rules={[{ required: true, message: "请输入密码" }]}
        />
      </LoginForm>
    </div>
  );
};

export default LoginPage;