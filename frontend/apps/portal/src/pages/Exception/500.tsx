import React from "react";
import { Button, Result, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { ReloadOutlined } from "@ant-design/icons";
import { useIntl } from "../../contexts/LocaleContext";

export const Exception500: React.FC = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
      }}
    >
      <Result
        status="500"
        title="500"
        subTitle={formatMessage({
          id: "exception.500.subTitle",
          defaultMessage: "抱歉，服务器内部遇到异常或网关微服务暂时无法响应，请稍后重试。",
        })}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              {formatMessage({
                id: "exception.reload",
                defaultMessage: "重新加载",
              })}
            </Button>
            <Button type="primary" onClick={() => navigate("/home")}>
              {formatMessage({
                id: "exception.backHome",
                defaultMessage: "返回门户首页",
              })}
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default Exception500;