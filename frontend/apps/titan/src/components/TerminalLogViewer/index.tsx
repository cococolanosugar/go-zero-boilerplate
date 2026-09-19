import React, { useState, useRef, useEffect } from "react";
import { Input, Button, Space, Switch, Tooltip, Typography, App } from "antd";
import {
  CopyOutlined,
  VerticalAlignBottomOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";

interface TerminalLogViewerProps {
  logs: string;
  loading?: boolean;
  title?: string;
  height?: number | string;
}

export const TerminalLogViewer: React.FC<TerminalLogViewerProps> = ({
  logs,
  loading = false,
  title = "实时执行日志",
  height = 500,
}) => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚屏到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 复制日志
  const handleCopy = () => {
    if (!logs) return;
    navigator.clipboard.writeText(logs);
    message.success("日志已复制到剪贴板");
  };

  // 过滤高亮行
  const lines = logs.split("\n");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#141414",
        borderRadius: 8,
        border: "1px solid #303030",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      }}
    >
      {/* 终端顶栏控制区 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          backgroundColor: "#1f1f1f",
          borderBottom: "1px solid #303030",
        }}
      >
        <Space orientation="horizontal" size={8}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f56", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ffbd2e", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#27c93f", display: "inline-block" }} />
          </div>
          <span style={{ color: "#d9d9d9", fontSize: 12, marginLeft: 8 }}>{title}</span>
        </Space>

        <Space orientation="horizontal" size={12}>
          <Input
            size="small"
            prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
            placeholder="搜索日志关键字..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 180, backgroundColor: "#262626", borderColor: "#434343", color: "#fff" }}
          />

          <Space size={4} style={{ color: "#8c8c8c", fontSize: 12 }}>
            <span>自动滚屏</span>
            <Switch size="small" checked={autoScroll} onChange={setAutoScroll} />
          </Space>

          <Tooltip title="滚至底部">
            <Button
              type="text"
              size="small"
              icon={<VerticalAlignBottomOutlined style={{ color: "#8c8c8c" }} />}
              onClick={() => {
                if (logContainerRef.current) {
                  logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
              }}
            />
          </Tooltip>

          <Tooltip title="复制全部">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: "#8c8c8c" }} />}
              onClick={handleCopy}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 终端正文区 */}
      <div
        ref={logContainerRef}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          overflowY: "auto",
          padding: "12px 16px",
          color: "#00ff66",
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {loading && <div style={{ color: "#1890ff" }}>⏳ 正在实时拉取控制台日志流...</div>}
        {lines.length === 0 || (lines.length === 1 && !lines[0]) ? (
          <div style={{ color: "#595959" }}>[暂无控制台日志输出]</div>
        ) : (
          lines.map((line, idx) => {
            const matches = keyword && line.toLowerCase().includes(keyword.toLowerCase());
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: matches ? "rgba(255, 215, 0, 0.2)" : "transparent",
                  color: line.includes("ERROR") || line.includes("FAILED") || line.includes("fatal")
                    ? "#ff4d4f"
                    : line.includes("WARN")
                    ? "#faad14"
                    : line.includes("SUCCESS") || line.includes("PASS")
                    ? "#52c41a"
                    : "#d4d4d4",
                }}
              >
                <span style={{ color: "#595959", marginRight: 12, userSelect: "none" }}>
                  {String(idx + 1).padStart(3, " ")}
                </span>
                {line}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TerminalLogViewer;
