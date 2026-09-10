import React, { useState } from "react";
import {
  App as AntdApp,
  Button,
  Descriptions,
  Divider,
  Result,
  Alert,
  Typography,
} from "antd";
import {
  PageContainer,
  ProCard,
  StepsForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
} from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@zero/shared";
import { useUnsavedWarning } from "../../../hooks";

const { Text, Paragraph } = Typography;

interface StepFormData {
  payAccount?: string;
  receiverAccount?: string;
  receiverName?: string;
  amount?: number;
  transferType?: string;
  remark?: string;
  password?: string;
}

export const StepFormPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<StepFormData>({
    payAccount: "ant-design@alipay.com",
    receiverAccount: "test@example.com",
    receiverName: "张三",
    amount: 500,
    transferType: "alipay",
    remark: "微服务基础设施升级专项款",
  });

  // 当处于向导填写阶段且存在脏数据时，自动启用离开拦截防呆保护
  useUnsavedWarning(isDirty && currentStep < 2, {
    message: "转账向导流程尚未完成，离开后输入内容将丢失，确定要离开吗？",
  });

  return (
    <PageContainer
      content="将一个冗长或高风险的业务表单拆分为多个步骤，按向导指引用户逐项输入与复核校验。"
    >
      <ProCard>
        <StepsForm<StepFormData>
          current={currentStep}
          onCurrentChange={setCurrentStep}
          submitter={{
            render: (props, dom) => {
              if (props.step === 2) {
                return null;
              }
              return dom;
            },
          }}
          onFinish={async (values) => {
            setFormData((prev) => ({ ...prev, ...values }));
            message.success("资金划转指令下发成功");
            setIsDirty(false);
            setCurrentStep(2);
            return true;
          }}
        >
          {/* 第一步：填写转账信息 */}
          <StepsForm.StepForm<StepFormData>
            name="base"
            title="填写付款信息"
            style={{ maxWidth: 520, margin: "0 auto" }}
            onFinish={async (values) => {
              setFormData((prev) => ({ ...prev, ...values }));
              setIsDirty(true);
              return true;
            }}
          >
            <ProFormSelect
              label="付款账户"
              name="payAccount"
              initialValue={formData.payAccount}
              rules={[{ required: true, message: "请选择付款账户" }]}
              options={[
                { label: "企业主对公账户 (**** 8888)", value: "ant-design@alipay.com" },
                { label: "零钱清算备付金账户 (**** 6666)", value: "settlement@example.com" },
              ]}
            />
            <ProFormSelect
              label="收款方式"
              name="transferType"
              initialValue={formData.transferType}
              rules={[{ required: true, message: "请选择收款方式" }]}
              options={[
                { label: "支付宝企业转账", value: "alipay" },
                { label: "银行大额跨行直连", value: "bank" },
              ]}
            />
            <ProFormText
              label="收款人账号"
              name="receiverAccount"
              initialValue={formData.receiverAccount}
              rules={[{ required: true, message: "请输入收款人账号" }]}
              placeholder="请输入收款人电子邮箱或银行卡号"
            />
            <ProFormText
              label="收款人姓名"
              name="receiverName"
              initialValue={formData.receiverName}
              rules={[{ required: true, message: "请输入收款人姓名" }]}
              placeholder="请输入收款人真实姓名"
            />
            <ProFormDigit
              label="转账金额"
              name="amount"
              initialValue={formData.amount}
              rules={[
                { required: true, message: "请输入转账金额" },
                { type: "number", min: 1, message: "金额不能少于 1 元" },
              ]}
              fieldProps={{
                prefix: "￥",
                precision: 2,
              }}
            />
            <ProFormText
              label="业务备注"
              name="remark"
              initialValue={formData.remark}
              placeholder="选填，注明款项用途"
            />
          </StepsForm.StepForm>

          {/* 第二步：确认转账信息 */}
          <StepsForm.StepForm<StepFormData>
            name="confirm"
            title="确认转账信息"
            style={{ maxWidth: 520, margin: "0 auto" }}
          >
            <Alert
              showIcon
              type="warning"
              title="确认转账后，资金将实时划拨入对方账户，无法原路撤回，请仔细核对。"
              style={{ marginBottom: 24 }}
            />
            <Descriptions column={1} bordered size="middle" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="付款账户">{formData.payAccount}</Descriptions.Item>
              <Descriptions.Item label="收款人姓名">{formData.receiverName}</Descriptions.Item>
              <Descriptions.Item label="收款账号">{formData.receiverAccount}</Descriptions.Item>
              <Descriptions.Item label="转账金额">
                <Text style={{ fontSize: 18, color: "#cf1322", fontWeight: "bold" }}>
                  {formatPrice(Number(formData.amount || 0))}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="款项说明">{formData.remark || "无"}</Descriptions.Item>
            </Descriptions>
            <Divider />
            <ProFormText.Password
              label="支付安全密码"
              name="password"
              rules={[{ required: true, message: "请输入 6 位支付确认密码" }]}
              placeholder="请输入管理员支付密码验证身份"
            />
          </StepsForm.StepForm>

          {/* 第三步：完成 */}
          <StepsForm.StepForm
            name="result"
            title="完成转账"
            style={{ maxWidth: 520, margin: "0 auto" }}
          >
            <Result
              status="success"
              title="操作成功"
              subTitle={`资金款项 ${formatPrice(Number(formData.amount || 0))} 已成功划转至 ${formData.receiverName}，预计两小时内到账。`}
              extra={[
                <Button
                  type="primary"
                  key="again"
                  onClick={() => {
                    setIsDirty(false);
                    setCurrentStep(0);
                  }}
                >
                  再转一笔
                </Button>,
                <Button key="orders" onClick={() => navigate("/orders")}>
                  查看订单记录
                </Button>,
              ]}
            >
              <div
                style={{
                  background: "#fafafa",
                  padding: "16px 24px",
                  borderRadius: 8,
                }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="交易单号">TX20260910008899</Descriptions.Item>
                  <Descriptions.Item label="付款账户">{formData.payAccount}</Descriptions.Item>
                  <Descriptions.Item label="收款账户">{formData.receiverAccount}</Descriptions.Item>
                </Descriptions>
              </div>
            </Result>
          </StepsForm.StepForm>
        </StepsForm>
      </ProCard>
    </PageContainer>
  );
};

export default StepFormPage;
