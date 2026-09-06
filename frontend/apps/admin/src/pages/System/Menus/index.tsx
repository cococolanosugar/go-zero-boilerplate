import React, { useRef } from "react";
import { Space, Tag } from "antd";
import {
  FolderOutlined,
  FileOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  ProTable,
  PageContainer,
  type ActionType,
  type ProColumns,
} from "@ant-design/pro-components";
import { getSysMenuTree, type SysMenuItem } from "@zero/api";
import { useIntl } from "../../../contexts/LocaleContext";

export const MenusPage: React.FC = () => {
  const { formatMessage } = useIntl();
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<SysMenuItem>[] = [
    {
      title: "菜单 / 权限点名称",
      dataIndex: "title",
      render: (_, record) => {
        let icon = <FolderOutlined style={{ color: "#1677ff" }} />;
        if (record.type === 2) {
          icon = <FileOutlined style={{ color: "#52c41a" }} />;
        } else if (record.type === 3) {
          icon = <ThunderboltOutlined style={{ color: "#fa8c16" }} />;
        }
        return (
          <Space>
            {icon}
            <span style={{ fontWeight: record.type === 1 ? 600 : 400 }}>
              {record.title}
            </span>
          </Space>
        );
      },
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 100,
      render: (_, record) => {
        if (record.type === 1) {
          return <Tag color="blue">目录</Tag>;
        }
        if (record.type === 2) {
          return <Tag color="green">菜单</Tag>;
        }
        return <Tag color="orange">按钮权限</Tag>;
      },
    },
    {
      title: "路由地址 (Path)",
      dataIndex: "path",
      render: (text) => (text ? <code>{text}</code> : "-"),
    },
    {
      title: "前端组件",
      dataIndex: "component",
      render: (text) => (text ? <span>{text}</span> : "-"),
    },
    {
      title: "权限标识 (Permission Code)",
      dataIndex: "permissionCode",
      render: (text) =>
        text ? (
          <Tag color="volcano">{text}</Tag>
        ) : (
          <span style={{ color: "#bfbfbf" }}>-</span>
        ),
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 80,
    },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({ id: "pages.system.menus.title", defaultMessage: "菜单与权限规则" }),
        subTitle: formatMessage({ id: "pages.system.menus.subTitle", defaultMessage: "维护前端路由导航菜单与按钮级细粒度权限点" }),
      }}
    >
      <ProTable<SysMenuItem>
        headerTitle="系统菜单与按钮权限树"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        request={async () => {
          const res = await getSysMenuTree();
          return {
            data: res.list || [],
            success: true,
          };
        }}
        columns={columns}
        pagination={false}
        expandable={{
          defaultExpandAllRows: true,
        }}
      />
    </PageContainer>
  );
};

export default MenusPage;
