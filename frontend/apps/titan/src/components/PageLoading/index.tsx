import React from "react";
import { Spin } from "antd";

export const PageLoading: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "40vh",
        width: "100%",
      }}
    >
      <Spin size="large" description="加载 Titan 资源中..." />
    </div>
  );
};

export default PageLoading;
