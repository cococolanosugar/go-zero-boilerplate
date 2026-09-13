import React from "react";
import { Typography, Row, Col, Tag, Space, Collapse } from "antd";
import {
  SafetyCertificateOutlined,
  ApiOutlined,
  ClusterOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { useIntl } from "../../contexts/LocaleContext";

const { Paragraph, Text } = Typography;

export const ServicesPage: React.FC = () => {
  const { formatMessage } = useIntl();

  const serviceDetails = [
    {
      title: formatMessage({
        id: "services.item.gateway.title",
        defaultMessage: "统一网关 BFF (Gateway)",
      }),
      icon: <ApiOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      desc: formatMessage({
        id: "services.item.gateway.desc",
        defaultMessage:
          "作为大仓唯一对外暴露的 HTTP 流量入口（端口 8888），承载统一路由、JWT Auth 身份解析、参数校验、跨微服务数据聚合与统一响应封装。",
      }),
      tags: ["HTTP 8888", "RESTful", "JWT Auth", "mr.Finish 聚合"],
    },
    {
      title: formatMessage({
        id: "services.item.user.title",
        defaultMessage: "用户中心微服务 (User RPC)",
      }),
      icon: <ClusterOutlined style={{ fontSize: 24, color: "#1677ff" }} />,
      desc: formatMessage({
        id: "services.item.user.desc",
        defaultMessage:
          "纯 gRPC 业务微服务（端口 8080），承载企业员工账号、角色管理、组织架构部门树、动态菜单树与按钮权限下发，以及角色权限一石二鸟事务闭环。",
      }),
      tags: ["gRPC 8080", "RBAC 权限树", "Bcrypt 加密", "事务原子同步"],
    },
    {
      title: formatMessage({
        id: "services.item.worker.title",
        defaultMessage: "异步任务调度微服务 (Worker RPC)",
      }),
      icon: <CloudServerOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      desc: formatMessage({
        id: "services.item.worker.desc",
        defaultMessage:
          "纯 gRPC 异步任务微服务（端口 8082），集成 Temporal 分布式任务引擎，承载多步骤长耗时工作流、定时调度（Cron Schedule）与状态追踪闭环。",
      }),
      tags: ["gRPC 8082", "Temporal 引擎", "分布式工作流", "定时任务"],
    },
    {
      title: formatMessage({
        id: "services.item.model.title",
        defaultMessage: "持久层与强一致缓存 (Model & Redis)",
      }),
      icon: <DatabaseOutlined style={{ fontSize: 24, color: "#fa8c16" }} />,
      desc: formatMessage({
        id: "services.item.model.desc",
        defaultMessage:
          "由 goctl model 从 MySQL DDL 逆向生成的带 Cache-Aside 机制 Go Model。单条记录走 Redis 缓存，更新与删除精准淘汰，多表变更严格由 TransactCtx 事务保证原子性。",
      }),
      tags: ["MySQL 8.0", "Redis 缓存", "Cache-Aside", "TransactCtx"],
    },
    {
      title: formatMessage({
        id: "services.item.nacos.title",
        defaultMessage: "服务注册与发现 (Nacos / Etcd)",
      }),
      icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: "#eb2f96" }} />,
      desc: formatMessage({
        id: "services.item.nacos.desc",
        defaultMessage:
          "原生支持 Nacos（默认）、Etcd 以及本地直连（Endpoints）三种寻址与治理模式，零代码改动，通过 YAML 配置文件一键无缝切换。",
      }),
      tags: ["Nacos 2.x", "Etcd 3.5", "平滑寻址", "零代码切换"],
    },
    {
      title: formatMessage({
        id: "services.item.toolchain.title",
        defaultMessage: "现代化工具链与规范 (Toolchain)",
      }),
      icon: <ToolOutlined style={{ fontSize: 24, color: "#13c2c2" }} />,
      desc: formatMessage({
        id: "services.item.toolchain.desc",
        defaultMessage:
          "由 mise 统一锁定 Go、Node、pnpm、goctl、protoc、just、antd-cli 版本；搭配 antd lint 静态诊断与代码知识图谱引擎，保障工程持续高可靠。",
      }),
      tags: ["mise", "justfile", "antd-cli", "pnpm workspace"],
    },
  ];

  return (
    <PageContainer
      header={{
        title: formatMessage({
          id: "services.page.title",
          defaultMessage: "微服务集群与技术治理体系",
        }),
        subTitle: formatMessage({
          id: "services.page.desc",
          defaultMessage:
            "探索 go-zero-boilerplate 的内部微服务编排、服务注册寻址、数据一致性保障与企业级规范防护。",
        }),
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          {serviceDetails.map((s, idx) => (
            <Col xs={24} md={12} key={idx}>
              <ProCard
                title={
                  <Space>
                    {s.icon}
                    <span style={{ fontWeight: 600 }}>{s.title}</span>
                  </Space>
                }
                headerBordered
                style={{ height: "100%" }}
              >
                <Paragraph style={{ minHeight: 48, color: "#595959" }}>{s.desc}</Paragraph>
                <Space wrap size={[4, 8]}>
                  {s.tags.map((t, i) => (
                    <Tag key={i} color="purple">
                      {t}
                    </Tag>
                  ))}
                </Space>
              </ProCard>
            </Col>
          ))}
        </Row>

        <ProCard
          title={formatMessage({
            id: "services.faq.title",
            defaultMessage: "深度架构规范问答 (Architecture FAQ)",
          })}
          headerBordered
        >
          <Collapse
            ghost
            defaultActiveKey={["1", "2"]}
            items={[
              {
                key: "1",
                label: (
                  <Text strong>
                    {formatMessage({
                      id: "services.faq.q1.title",
                      defaultMessage: "为什么网关 Logic 严禁直连持久层数据库？",
                    })}
                  </Text>
                ),
                children: (
                  <Paragraph type="secondary">
                    {formatMessage({
                      id: "services.faq.q1.desc",
                      defaultMessage:
                        "网关作为 BFF（Backend For Frontend）层，核心职责是路由分发、参数校验、JWT 鉴权与跨微服务调用编排（mr.Finish）。直接持有数据库连接会破坏微服务领域边界，导致业务逻辑与持久层严重耦合，无法独立伸缩与治理。",
                    })}
                  </Paragraph>
                ),
              },
              {
                key: "2",
                label: (
                  <Text strong>
                    {formatMessage({
                      id: "services.faq.q2.title",
                      defaultMessage: "角色分配权限时，如何做到页面按钮与底层 API 的一石二鸟事务联动？",
                    })}
                  </Text>
                ),
                children: (
                  <Paragraph type="secondary">
                    {formatMessage({
                      id: "services.faq.q2.desc",
                      defaultMessage:
                        "在用户微服务中，我们维护了 sys_menu_api 字典。当管理员在界面上为角色勾选菜单与按钮权限点时，后端在原子事务中写入 sys_role_menu 的同时，自动反查已勾选节点绑定的底层 API 资源，级联写入 sys_role_api，避免了前后端权限双重配置的不一致风险。",
                    })}
                  </Paragraph>
                ),
              },
              {
                key: "3",
                label: (
                  <Text strong>
                    {formatMessage({
                      id: "services.faq.q3.title",
                      defaultMessage: "前端如何实现毫秒级强类型调用微服务？",
                    })}
                  </Text>
                ),
                children: (
                  <Paragraph type="secondary">
                    {formatMessage({
                      id: "services.faq.q3.desc",
                      defaultMessage:
                        "通过执行 just gen-ts，goctl 会解析网关的 .api 契约，自动在 @zero/api 共享包中输出完整的 TypeScript 请求函数与参数定义。前端应用引入后即可享有 IDE 的自动补全与类型检查，免去手写 API 接口的繁琐。",
                    })}
                  </Paragraph>
                ),
              },
            ]}
          />
        </ProCard>
      </div>
    </PageContainer>
  );
};

export default ServicesPage;
