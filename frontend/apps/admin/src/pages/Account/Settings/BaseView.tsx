import React, { useState, useEffect, useRef } from "react";
import { App, Row, Col, Avatar, Button, Tag, Typography, Upload } from "antd";
import { UserOutlined, UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { ProForm, ProFormText, type ProFormInstance } from "@ant-design/pro-components";
import { updatePersonalProfile, uploadSingleFile } from "@zero/api";
import { useInitialState } from "../../../contexts/InitialStateContext";
import { useIntl } from "../../../contexts/LocaleContext";

const { Text, Title } = Typography;

export const BaseView: React.FC = () => {
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  const { initialState, refreshInitialState } = useInitialState();
  const formRef = useRef<ProFormInstance>();
  const currentUser = initialState.currentUser;

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      formRef.current?.setFieldsValue({
        username: currentUser.username,
        realName: currentUser.realName || currentUser.username,
        mobile: currentUser.mobile || "",
        email: currentUser.email || "",
      });
      setAvatarUrl(currentUser.avatar || "/favicon.svg");
    }
  }, [currentUser]);

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      const res = await uploadSingleFile(file);
      const newUrl = res?.url || "";
      if (!newUrl) {
        throw new Error("上传失败，未获取到图片地址");
      }
      setAvatarUrl(newUrl);

      // 同步保存头像至个人资料
      await updatePersonalProfile({
        realName: formRef.current?.getFieldValue("realName") || currentUser?.realName || currentUser?.username || "",
        mobile: formRef.current?.getFieldValue("mobile") || currentUser?.mobile || "",
        email: formRef.current?.getFieldValue("email") || currentUser?.email || "",
        avatar: newUrl,
      });

      message.success("头像上传并更新成功");
      await refreshInitialState();
    } catch (err: any) {
      message.error(err?.message || "头像上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      await updatePersonalProfile({
        realName: values.realName,
        mobile: values.mobile,
        email: values.email,
        avatar: avatarUrl,
      });
      message.success(formatMessage({ id: "common.success", defaultMessage: "基本信息更新成功" }));
      await refreshInitialState();
    } catch (err: any) {
      message.error(err?.message || "更新信息失败，请稍后重试");
    }
  };

  return (
    <div style={{ padding: "12px 0" }}>
      <Row gutter={[32, 24]}>
        <Col xs={24} md={16} lg={14}>
          <ProForm
            formRef={formRef}
            layout="vertical"
            onFinish={handleFinish}
            submitter={{
              searchConfig: {
                submitText: "更新基本信息",
              },
              resetButtonProps: {
                style: { display: "none" },
              },
              submitButtonProps: {
                type: "primary",
                size: "middle",
              },
            }}
          >
            <ProFormText
              name="username"
              label="登录账号"
              disabled
              tooltip="登录用户名由系统唯一分配，暂不支持修改"
            />
            <ProFormText
              name="realName"
              label="真实姓名 / 显示昵称"
              placeholder="请输入您的真实姓名"
              rules={[{ required: true, message: "请输入真实姓名" }]}
            />
            <ProFormText
              name="mobile"
              label="联系手机号"
              placeholder="请输入手机号"
              rules={[
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: "请输入合法的 11 位手机号码",
                },
              ]}
            />
            <ProFormText
              name="email"
              label="联系电子邮箱"
              placeholder="请输入电子邮箱"
              rules={[
                {
                  type: "email",
                  message: "请输入合法的电子邮箱地址",
                },
              ]}
            />
          </ProForm>
        </Col>

        <Col xs={24} md={8} lg={10}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              用户头像
            </Title>
            <Avatar
              size={104}
              src={avatarUrl || "/favicon.svg"}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Upload
              showUploadList={false}
              accept="image/*"
              beforeUpload={(file) => {
                handleAvatarUpload(file);
                return false;
              }}
            >
              <Button
                icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                loading={uploading}
                style={{ marginBottom: 20 }}
              >
                {uploading ? "正在上传..." : "更换头像"}
              </Button>
            </Upload>
            <div style={{ width: "100%", maxWidth: 280, textAlign: "left" }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  所属角色：
                </Text>
                <div style={{ marginTop: 4 }}>
                  {initialState.isSuperAdmin ? (
                    <Tag color="gold">超级管理员</Tag>
                  ) : (
                    (currentUser?.roles || ["普通用户"]).map((r, i) => (
                      <Tag key={i} color="blue">
                        {r}
                      </Tag>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  所属部门：
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="cyan">{currentUser?.deptName || "核心研发架构部"}</Tag>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default BaseView;
