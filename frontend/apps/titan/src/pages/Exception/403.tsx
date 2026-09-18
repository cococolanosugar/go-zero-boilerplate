import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export const Exception403: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问该 Titan 模块。"
      extra={
        <Button type="primary" onClick={() => navigate("/pipelines")}>
          返回流水线中心
        </Button>
      }
    />
  );
};

export default Exception403;
