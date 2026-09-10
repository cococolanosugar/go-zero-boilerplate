import React, { useRef } from "react";
import { App as AntdApp, Button, Tag, Badge } from "antd";
import { ReloadOutlined, ApiOutlined } from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import { listSysApis, type SysApiItem } from "@zero/api";
import { useIntl } from "../../../contexts/LocaleContext";

export const ApisPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);

  const methodColorMap: Record<string, string> = {
    GET: "green",
    POST: "blue",
    PUT: "orange",
    DELETE: "red",
  };

  const columns: ProColumns<SysApiItem>[] = [
    {
      title: "服务 / 分组",
      dataIndex: "apiGroup",
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: "接口名称",
      dataIndex: "title",
      render: (text) => (
        <span>
          <ApiOutlined style={{ marginRight: 8, color: "#1677ff" }} />
          <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: "请求方法 (Method)",
      dataIndex: "method",
      render: (text) => {
        const method = String(text).toUpperCase();
        return <Tag color={methodColorMap[method] || "default"}>{method}</Tag>;
      },
    },
    {
      title: "接口路径 (Path)",
      dataIndex: "path",
      render: (text) => <code>{text}</code>,
    },
    {
      title: "自动同步",
      dataIndex: "isAutoSync",
      render: (_, record) =>
        record.isAutoSync === 1 ? (
          <Badge status="processing" text="自动契约同步" />
        ) : (
          <Badge status="default" text="手动登记" />
        ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.system.apis.title", defaultMessage: "后端 API 资产字典" }),
        subTitle: formatMessage({ id: "pages.system.apis.subTitle", defaultMessage: "登记统一网关暴露的所有 RESTful 接口与请求方式" }),
      }}
    >
      <ProTable<SysApiItem>
        headerTitle="系统 API 资源字典与权限映射"
        actionRef={actionRef}
        rowKey="id"
        columnsState={{
          persistenceKey: "pro-table-columns-system-apis",
          persistenceType: "localStorage",
        }}
        search={{
          labelWidth: "auto",
        }}
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => {
              actionRef.current?.reload();
              message.success("接口字典已重新拉取");
            }}
          >
            刷新接口字典
          </Button>,
        ]}
        request={async (params) => {
          const res = await listSysApis();
          let list = res.list || [];
          if (params.apiGroup) {
            list = list.filter((item) =>
              item.apiGroup.toLowerCase().includes(String(params.apiGroup).toLowerCase())
            );
          }
          if (params.title) {
            list = list.filter((item) =>
              item.title.toLowerCase().includes(String(params.title).toLowerCase())
            );
          }
          return {
            data: list,
            success: true,
          };
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
        }}
      />
    </PageContainer>
  );
};

export default ApisPage;
