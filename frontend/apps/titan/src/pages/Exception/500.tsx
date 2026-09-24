import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export const Exception500: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="500"
      title="500"
      subTitle="抱歉，服务器内部遇到异常，请稍后刷新重试。"
      extra={
        <Button type="primary" onClick={() => navigate("/pipelines")}>
          返回流水线中心
        </Button>
      }
    />
  );
};

export default Exception500;
