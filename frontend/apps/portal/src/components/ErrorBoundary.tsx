import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Result, Typography } from "antd";
import { ReloadOutlined, HomeOutlined } from "@ant-design/icons";

const { Paragraph, Text } = Typography;

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackRender?: (props: {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    resetErrorBoundary: () => void;
  }) => ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught unhandled rendering error:", error, errorInfo);
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            padding: 24,
          }}
        >
          <Result
            status="error"
            title="页面渲染发生异常"
            subTitle="当前视图因组件运行时错误崩溃，已启用错误边界隔离，全局导航与其它模块正常可用。"
            extra={[
              <Button
                type="primary"
                key="retry"
                icon={<ReloadOutlined />}
                onClick={this.resetErrorBoundary}
              >
                重试本页面
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                返回首页
              </Button>,
            ]}
          >
            {this.state.error && (
              <div
                style={{
                  textAlign: "left",
                  background: "#fafafa",
                  padding: 16,
                  borderRadius: 6,
                  border: "1px solid #f0f0f0",
                  maxWidth: 680,
                  margin: "0 auto",
                }}
              >
                <Paragraph>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    错误原因：
                  </Text>{" "}
                  {this.state.error.toString()}
                </Paragraph>
                {this.state.errorInfo?.componentStack && (
                  <pre
                    style={{
                      maxHeight: 120,
                      overflow: "auto",
                      fontSize: 12,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      color: "#666",
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
