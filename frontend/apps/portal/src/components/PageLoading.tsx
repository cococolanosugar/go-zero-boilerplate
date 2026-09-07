import React from "react";
import { Spin } from "antd";

export interface PageLoadingProps {
  tip?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * 门户页面级异步分包加载占位组件 (Suspense Fallback)
 */
export const PageLoading: React.FC<PageLoadingProps> = ({ tip, description }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 360,
        height: "100%",
        padding: 32,
      }}
    >
      <Spin size="large" description={description ?? tip} />
    </div>
  );
};


export default PageLoading;
