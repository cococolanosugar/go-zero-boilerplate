import React, { useState, useEffect } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Alert,
  Card,
  Typography,
  App,
  Grid,
} from "antd";
import { PlusOutlined, DeleteOutlined, RocketOutlined } from "@ant-design/icons";
import { useProject } from "../../contexts/ProjectContext";
import {
  createReleaseOrder,
  titanListApps,
  type TitanListApps200ListItem,
} from "@zero/api";

const { TextArea } = Input;
const { Text } = Typography;

interface CreateReleaseDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateReleaseDrawer: React.FC<CreateReleaseDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { currentProjectId } = useProject();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = typeof screens.md !== "undefined" ? !screens.md : false;
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<TitanListApps200ListItem[]>([]);
  const targetEnv = Form.useWatch("targetEnv", form);

  // 加载当前项目下的微服务列表
  useEffect(() => {
    if (open && currentProjectId) {
      titanListApps(currentProjectId, { page: 1, pageSize: 100 })
        .then((res) => {
          setApps(res.list || []);
        })
        .catch(() => {});
    }
  }, [open, currentProjectId]);

  const handleSubmit = async () => {
    if (!currentProjectId) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      const servicesJson = JSON.stringify(
        values.services.map((s: any) => ({
          appId: s.appId,
          appName: apps.find((a) => a.id === s.appId)?.name || "service",
          version: s.version,
          gitCommit: s.gitCommit || "HEAD",
        }))
      );

      const res = await createReleaseOrder({
        projectId: currentProjectId,
        title: values.title,
        description: values.description || "",
        targetEnv: values.targetEnv,
        servicesJson,
        scheduledTime: values.scheduledTime ? values.scheduledTime.format("YYYY-MM-DD HH:mm:ss") : undefined,
      });

      if (res?.status === "PENDING_APPROVAL") {
        message.warning(`生产发布单已创建，已自动联动发起 ITSM 变更审批 (单号: ${res.orderNo})`);
      } else {
        message.success(`发布单创建成功 (单号: ${res.orderNo})`);
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.message || "创建发布单失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="新建发布单与变更申请"
      placement="right"
      size={isMobile ? "100%" : 640}
      open={open}
      onClose={onClose}
      styles={{
        body: {
          padding: isMobile ? 16 : 24,
          paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 20px) + 24px)" : 24,
        },
      }}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" icon={<RocketOutlined />} loading={loading} onClick={handleSubmit}>
            {isMobile ? "提交" : "提交发布单"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          targetEnv: "test",
          services: [{ appId: undefined, version: "v1.0.0", gitCommit: "main" }],
        }}
      >
        <Form.Item
          name="title"
          label="发布单标题"
          rules={[{ required: true, message: "请输入发布单标题" }]}
        >
          <Input placeholder="例如: 2026-09 核心金融微服务版本发布" />
        </Form.Item>

        <Form.Item
          name="targetEnv"
          label="目标环境"
          rules={[{ required: true, message: "请选择目标发布环境" }]}
        >
          <Select
            options={[
              { label: "DEV (开发联调环境)", value: "dev" },
              { label: "TEST (测试验证环境)", value: "test" },
              { label: "STAGING (预发布灰度环境)", value: "staging" },
              { label: "PROD (核心生产环境 - 需 ITSM 流程卡点)", value: "prod" },
            ]}
          />
        </Form.Item>

        {targetEnv === "prod" && (
          <Alert
            title="生产合规与 ITSM 审批卡点提醒"
            description="检测到发布目标为 PROD 生产环境。提交后发布单将自动挂起进入 PENDING_APPROVAL 待审批态，并自动向 ITSM 工单系统派发生产变更审批流。审批通过前流水线被严格阻断。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item name="scheduledTime" label="计划发布时间">
          <DatePicker showTime style={{ width: "100%" }} placeholder="默认为立即发布" />
        </Form.Item>

        <Form.Item name="description" label="变更内容说明">
          <TextArea rows={3} placeholder="请简述本次发布包含的功能迭代、风险评估与回滚预案..." />
        </Form.Item>

        {/* 包含的微服务列表 */}
        <div style={{ marginBottom: 8 }}>
          <Text strong>变更微服务及目标版本</Text>
        </div>

        <Form.List name="services">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: 12, backgroundColor: "#fafafa" }}
                  title={
                    isMobile ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong style={{ fontSize: 13 }}>微服务 #{name + 1}</Text>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    ) : undefined
                  }
                >
                  {isMobile ? (
                    <div>
                      <Form.Item
                        {...restField}
                        name={[name, "appId"]}
                        label="微服务"
                        rules={[{ required: true, message: "选择微服务" }]}
                        style={{ marginBottom: 10 }}
                      >
                        <Select
                          placeholder="选择微服务"
                          options={apps.map((a) => ({
                            label: a.displayName || a.name,
                            value: a.id,
                          }))}
                        />
                      </Form.Item>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Form.Item
                          {...restField}
                          name={[name, "version"]}
                          label="版本 Tag"
                          rules={[{ required: true, message: "版本Tag" }]}
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Input placeholder="如 v2.1.0" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "gitCommit"]}
                          label="Commit/分支"
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Input placeholder="Commit/分支" />
                        </Form.Item>
                      </div>
                    </div>
                  ) : (
                    <Space align="baseline" style={{ display: "flex", width: "100%" }}>
                      <Form.Item
                        {...restField}
                        name={[name, "appId"]}
                        rules={[{ required: true, message: "选择微服务" }]}
                        style={{ width: 220, marginBottom: 0 }}
                      >
                        <Select
                          placeholder="选择微服务"
                          options={apps.map((a) => ({
                            label: a.displayName || a.name,
                            value: a.id,
                          }))}
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, "version"]}
                        rules={[{ required: true, message: "版本Tag" }]}
                        style={{ width: 160, marginBottom: 0 }}
                      >
                        <Input placeholder="版本号 (如 v2.1.0)" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, "gitCommit"]}
                        style={{ width: 140, marginBottom: 0 }}
                      >
                        <Input placeholder="Commit/分支" />
                      </Form.Item>

                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      )}
                    </Space>
                  )}
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 4 }}
              >
                添加微服务
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
};

export default CreateReleaseDrawer;
