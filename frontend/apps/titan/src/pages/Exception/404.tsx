import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export const Exception404: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      extra={
        <Button type="primary" onClick={() => navigate("/pipelines")}>
          返回流水线中心
        </Button>
      }
    />
  );
};

export default Exception404;
