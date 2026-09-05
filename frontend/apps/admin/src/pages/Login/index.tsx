import React, { useState } from "react";
import { App as AntdApp } from "antd";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { LockOutlined, MobileOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { login, setToken } from "@zero/api";
import { APP_NAME } from "@zero/shared";

export const LoginPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { mobile: string; password: string }) => {
    setLoading(true);
    try {
      const res = await login({
        mobile: values.mobile,
        password: values.password,
      });
      setToken(res.accessToken);
      message.success(`欢迎回来，${res.username || "管理员"}！`);
      
      const from = (location.state as any)?.from?.pathname || "/dashboard";
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
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        loading={loading}
        initialValues={{
          mobile: "13800000000",
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
          name="mobile"
          fieldProps={{
            size: "large",
            prefix: <MobileOutlined style={{ color: "#1677ff" }} />,
          }}
          placeholder="手机号（演示默认: 13800000000）"
          rules={[
            { required: true, message: "请输入手机号" },
            { pattern: /^1\d{10}$/, message: "手机号格式不正确" },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: "large",
            prefix: <LockOutlined style={{ color: "#1677ff" }} />,
          }}
          placeholder="密码（演示默认: 123456）"
          rules={[{ required: true, message: "请输入密码" }]}
        />
      </LoginForm>
    </div>
  );
};

export default LoginPage;