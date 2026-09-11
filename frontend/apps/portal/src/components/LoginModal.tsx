import React, { useState } from "react";
import { App as AntdApp, Modal, Tabs, Alert, Button, Divider } from "antd";
import {
  LoginForm,
  ProFormText,
} from "@ant-design/pro-components";
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { buildCasdoorAuthUrl } from "@zero/shared";
import { useAuth } from "../contexts/AuthContext";
import { useIntl } from "../contexts/LocaleContext";

interface LoginModalProps {
  open: boolean;
  onCancel: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open, onCancel }) => {
  const { message } = AntdApp.useApp();
  const { loginAsSysUser, loginAsMobile } = useAuth();
  const { formatMessage } = useIntl();
  const [loginType, setLoginType] = useState<"sys" | "mobile">("sys");
  const [submitting, setSubmitting] = useState(false);

  const handleSysLogin = async (values: any) => {
    setSubmitting(true);
    try {
      await loginAsSysUser({
        account: values.account,
        password: values.password,
      });
      message.success(
        formatMessage({
          id: "login.success.sys",
          defaultMessage: "系统员工登录成功！已加载权限画像",
        })
      );
      onCancel();
    } catch (err: any) {
      message.error(err.message || "系统员工登录失败，请检查账号密码");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMobileLogin = async (values: any) => {
    setSubmitting(true);
    try {
      await loginAsMobile({
        mobile: values.mobile,
        password: values.password,
      });
      message.success(
        formatMessage({
          id: "login.success.mobile",
          defaultMessage: "业务账号登录成功！",
        })
      );
      onCancel();
    } catch (err: any) {
      message.error(err.message || "登录失败，请检查手机号与密码");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={440}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: "#722ed1", fontSize: 20 }} />
          <span>
            {formatMessage({
              id: "login.title",
              defaultMessage: "统一身份认证中心",
            })}
          </span>
        </div>
      }
    >
      <Tabs
        activeKey={loginType}
        onChange={(key) => setLoginType(key as "sys" | "mobile")}
        centered
        items={[
          {
            key: "sys",
            label: formatMessage({
              id: "login.tab.sys",
              defaultMessage: "企业员工 / 管理员登录",
            }),
          },
          {
            key: "mobile",
            label: formatMessage({
              id: "login.tab.mobile",
              defaultMessage: "普通业务用户登录",
            }),
          },
        ]}
      />

      {loginType === "sys" ? (
        <div style={{ marginTop: 8 }}>
          <Alert
            title={formatMessage({
              id: "login.sys.tip.title",
              defaultMessage: "企业员工身份 (Sys User)",
            })}
            description={formatMessage({
              id: "login.sys.tip.desc",
              defaultMessage:
                "支持管理员与部门员工账号，登录后自动调取 RBAC 角色与按钮数据权限。",
            })}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <LoginForm
            loading={submitting}
            initialValues={{
              account: "admin",
              password: "123456",
            }}
            onFinish={handleSysLogin}
            submitter={{
              searchConfig: {
                submitText: formatMessage({
                  id: "login.submit.sys",
                  defaultMessage: "以企业员工身份登录",
                }),
              },
            }}
          >
            <ProFormText
              name="account"
              fieldProps={{
                size: "large",
                prefix: <UserOutlined style={{ color: "#722ed1" }} />,
              }}
              placeholder={formatMessage({
                id: "login.account.placeholder",
                defaultMessage: "员工账号 / 手机号（默认: admin）",
              })}
              rules={[{ required: true, message: "请输入账号或手机号" }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: "large",
                prefix: <LockOutlined style={{ color: "#722ed1" }} />,
              }}
              placeholder={formatMessage({
                id: "login.password.placeholder",
                defaultMessage: "密码（默认: 123456）",
              })}
              rules={[{ required: true, message: "请输入密码" }]}
            />
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <Divider plain style={{ margin: "16px 0 12px", color: "#8c8c8c", fontSize: 13 }}>
                {formatMessage({
                  id: "login.casdoor.divider",
                  defaultMessage: "或使用企业统一身份登录",
                })}
              </Divider>
              <Button
                block
                size="large"
                icon={<SafetyCertificateOutlined style={{ color: "#722ed1" }} />}
                onClick={() => {
                  const redirectUri = `${window.location.origin}/callback`;
                  const authUrl = buildCasdoorAuthUrl({ redirectUri });
                  window.location.href = authUrl;
                }}
              >
                {formatMessage({
                  id: "login.casdoor.button",
                  defaultMessage: "Casdoor 企业统一 SSO 登录",
                })}
              </Button>
            </div>
          </LoginForm>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <Alert
            title={formatMessage({
              id: "login.mobile.tip.title",
              defaultMessage: "前台消费者身份",
            })}
            description={formatMessage({
              id: "login.mobile.tip.desc",
              defaultMessage: "演示普通端消费者登录，调用 User 微服务 Login 接口。",
            })}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <LoginForm
            loading={submitting}
            initialValues={{
              mobile: "13800000000",
              password: "123456",
            }}
            onFinish={handleMobileLogin}
            submitter={{
              searchConfig: {
                submitText: formatMessage({
                  id: "login.submit.mobile",
                  defaultMessage: "立即登录",
                }),
              },
            }}
          >
            <ProFormText
              name="mobile"
              fieldProps={{
                size: "large",
                prefix: <MobileOutlined style={{ color: "#722ed1" }} />,
              }}
              placeholder={formatMessage({
                id: "login.mobile.placeholder",
                defaultMessage: "手机号（默认: 13800000000）",
              })}
              rules={[
                { required: true, message: "请输入手机号" },
                { pattern: /^1\d{10}$/, message: "手机号格式不正确" },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: "large",
                prefix: <LockOutlined style={{ color: "#722ed1" }} />,
              }}
              placeholder={formatMessage({
                id: "login.password.placeholder",
                defaultMessage: "密码（默认: 123456）",
              })}
              rules={[{ required: true, message: "请输入密码" }]}
            />
          </LoginForm>
        </div>
      )}
    </Modal>
  );
};

export default LoginModal;
