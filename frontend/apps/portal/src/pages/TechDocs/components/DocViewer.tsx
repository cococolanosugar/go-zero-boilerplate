import React, { useState } from "react";
import { Tag, Button, Typography, App, theme } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CopyOutlined,
  CheckOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { DocChapterVO, DocCalloutVO, DocCodeBlockVO } from "../types";

const { Title, Paragraph, Text } = Typography;

export interface DocViewerProps {
  chapter: DocChapterVO;
  categoryTitle?: string;
  prevChapter?: DocChapterVO | null;
  nextChapter?: DocChapterVO | null;
  onNavigateChapter: (chapterId: string) => void;
  style?: React.CSSProperties;
}

// 语法代码块渲染组件
const CodeBlock: React.FC<{ block: DocCodeBlockVO }> = ({ block }) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(block.code);
        setCopied(true);
        message.success("代码已复制到剪贴板");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      message.error("复制失败，请手动选择复制");
    }
  };

  return (
    <div
      style={{
        margin: "16px 0",
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: "hidden",
        background: token.colorFillQuaternary,
      }}
    >
      {/* 头部文件名与语言标识 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: token.colorFillTertiary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text code style={{ fontSize: 11, background: "transparent", border: "none" }}>
            {block.filename || block.language.toUpperCase()}
          </Text>
          <Tag color="geekblue" style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}>
            {block.language}
          </Tag>
        </div>

        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
          onClick={handleCopy}
          style={{ fontSize: 12 }}
        >
          {copied ? "已复制" : "复制"}
        </Button>
      </div>

      {/* 代码正文 */}
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          overflowX: "auto",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: 13,
          lineHeight: 1.6,
          background: token.colorBgElevated,
          color: token.colorText,
        }}
      >
        <code>{block.code}</code>
      </pre>
    </div>
  );
};

// Callout 提示框渲染组件
const CalloutBlock: React.FC<{ callout: DocCalloutVO }> = ({ callout }) => {
  const { token } = theme.useToken();

  let borderColor = token.colorInfo;
  let bgColor = token.colorInfoBg;
  let icon = <InfoCircleOutlined style={{ color: token.colorInfo, fontSize: 16 }} />;
  let defaultTitle = "提示";

  if (callout.type === "tip") {
    borderColor = token.colorSuccess;
    bgColor = token.colorSuccessBg;
    icon = <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />;
    defaultTitle = "最佳实践";
  } else if (callout.type === "warning") {
    borderColor = token.colorWarning;
    bgColor = token.colorWarningBg;
    icon = <WarningOutlined style={{ color: token.colorWarning, fontSize: 16 }} />;
    defaultTitle = "注意事项";
  } else if (callout.type === "important") {
    borderColor = token.colorError;
    bgColor = token.colorErrorBg;
    icon = <ExclamationCircleOutlined style={{ color: token.colorError, fontSize: 16 }} />;
    defaultTitle = "重要守则";
  }

  return (
    <div
      style={{
        margin: "16px 0",
        padding: "12px 16px",
        borderRadius: token.borderRadiusLG,
        background: bgColor,
        borderLeft: `4px solid ${borderColor}`,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: token.colorTextHeading,
              marginBottom: 4,
            }}
          >
            {callout.title || defaultTitle}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: token.colorText,
            }}
          >
            {callout.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DocViewer: React.FC<DocViewerProps> = ({
  chapter,
  categoryTitle,
  prevChapter,
  nextChapter,
  onNavigateChapter,
  style,
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: "28px 36px",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* 头部元数据 */}
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${token.colorBorderSecondary}`, paddingBottom: 20 }}>
        {categoryTitle && (
          <div style={{ marginBottom: 8 }}>
            <Tag color="cyan" style={{ fontSize: 12, padding: "2px 8px" }}>
              {categoryTitle}
            </Tag>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
            {chapter.title}
          </Title>
          {chapter.badge && (
            <Tag color="purple" style={{ fontSize: 12, lineHeight: "20px" }}>
              {chapter.badge}
            </Tag>
          )}
        </div>

        {/* 篇头属性 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 12,
            marginBottom: 16,
            fontSize: 13,
            color: token.colorTextSecondary,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <ClockCircleOutlined /> 阅读时间约 {chapter.readTime}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <CalendarOutlined /> 更新于 {chapter.updatedAt}
          </span>
        </div>

        {/* 摘要框 */}
        <div
          style={{
            padding: "12px 16px",
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadiusLG,
            borderLeft: `4px solid ${token.colorPrimary}`,
            fontSize: 14,
            color: token.colorTextSecondary,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {chapter.summary}
        </div>
      </div>

      {/* 文档正文各小节渲染 */}
      <div style={{ minHeight: 400 }}>
        {chapter.sections.map((sec, index) => (
          <div key={index} style={{ marginBottom: 20 }}>
            {/* 二级标题 */}
            {sec.heading && sec.heading.level === 2 && (
              <div
                id={sec.heading.id}
                style={{
                  scrollMarginTop: 80,
                  marginTop: 32,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    color: token.colorTextHeading,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <LinkOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
                  {sec.heading.text}
                </Title>
              </div>
            )}

            {/* 三级标题 */}
            {sec.heading && sec.heading.level === 3 && (
              <div
                id={sec.heading.id}
                style={{
                  scrollMarginTop: 80,
                  marginTop: 20,
                  marginBottom: 10,
                }}
              >
                <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>
                  {sec.heading.text}
                </Title>
              </div>
            )}

            {/* 段落渲染 */}
            {sec.paragraphs &&
              sec.paragraphs.map((p, pIndex) => (
                <Paragraph
                  key={pIndex}
                  style={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: token.colorText,
                    marginBottom: 12,
                  }}
                >
                  {p}
                </Paragraph>
              ))}

            {/* 列表渲染 */}
            {sec.list && (
              <ul
                style={{
                  paddingLeft: 22,
                  margin: "8px 0 16px 0",
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: token.colorText,
                }}
              >
                {sec.list.map((item, lIndex) => (
                  <li key={lIndex} style={{ marginBottom: 4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {/* Callout 渲染 */}
            {sec.callout && <CalloutBlock callout={sec.callout} />}

            {/* 代码块渲染 */}
            {sec.codeBlock && <CodeBlock block={sec.codeBlock} />}
          </div>
        ))}
      </div>

      {/* 底部前后篇导航 */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {prevChapter ? (
          <Button
            type="default"
            icon={<LeftOutlined />}
            onClick={() => onNavigateChapter(prevChapter.id)}
            style={{
              height: "auto",
              padding: "8px 14px",
              textAlign: "left",
              borderRadius: token.borderRadiusLG,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: token.colorTextTertiary }}>上一篇</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: token.colorTextHeading }}>
                {prevChapter.title}
              </div>
            </div>
          </Button>
        ) : (
          <div />
        )}

        {nextChapter ? (
          <Button
            type="primary"
            onClick={() => onNavigateChapter(nextChapter.id)}
            style={{
              height: "auto",
              padding: "8px 14px",
              textAlign: "right",
              borderRadius: token.borderRadiusLG,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>下一篇</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{nextChapter.title}</div>
            </div>
            <RightOutlined />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

export default DocViewer;
