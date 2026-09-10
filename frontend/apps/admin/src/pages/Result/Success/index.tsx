import React from "react";
import { Button, Result, Descriptions, Steps, Typography, Space } from "antd";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";

const { Paragraph, Text } = Typography;

export const SuccessResultPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <ProCard>
        <Result
          status="success"
          title="提交成功"
          subTitle="提交结果页用于反馈关键操作的处理结果。灰色卡片区域可展示进度指示与审核流转明细。"
          extra={[
            <Button type="primary" key="console" onClick={() => navigate("/dashboard")}>
              返回工作台
            </Button>,
            <Button key="buy" onClick={() => navigate("/orders")}>
              查看订单明细
            </Button>,
            <Button key="print" onClick={() => window.print()}>
              打印单据凭证
            </Button>,
          ]}
        >
          <div
            style={{
              background: "#fafafa",
              padding: "24px 40px",
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <Descriptions title="项目申请信息" column={{ xs: 1, sm: 2, md: 3 }} size="middle">
              <Descriptions.Item label="项目编号">PRJ-2026-MICRO-001</Descriptions.Item>
              <Descriptions.Item label="项目负责人">超级管理员</Descriptions.Item>
              <Descriptions.Item label="生效时间">2026-09-10 ~ 2027-09-10</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 16 }}>流转审批进度</Text>
              <Steps
                current={1}
                type="dot"
                items={[
                  { title: "创建申请", description: "张三 (已提交)" },
                  { title: "部门领导初审", description: "李四 (审核中)" },
                  { title: "财务中心复核", description: "王五 (待执行)" },
                  { title: "完成交付", description: "待执行" },
                ]}
              />
            </div>
          </div>
        </Result>
      </ProCard>
    </PageContainer>
  );
};

export default SuccessResultPage;
