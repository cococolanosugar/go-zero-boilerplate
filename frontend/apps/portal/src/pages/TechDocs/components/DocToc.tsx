import React, { useState, useEffect } from "react";
import { theme } from "antd";
import {
  UnorderedListOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import type { DocHeadingVO } from "../types";

export interface DocTocProps {
  headings: DocHeadingVO[];
  style?: React.CSSProperties;
}

export const DocToc: React.FC<DocTocProps> = ({ headings, style }) => {
  const { token } = theme.useToken();
  const [activeId, setActiveId] = useState<string>(() => headings[0]?.id || "");

  // 监听滚动位置，高亮当前视口内的标题
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      let currentId = headings[0]?.id || "";

      for (let i = 0; i < headings.length; i++) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            currentId = headings[i].id;
          }
        }
      }

      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: "16px",
        boxSizing: "border-box",
        position: "sticky",
        top: 80,
        ...style,
      }}
    >
      {/* 头部标题 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <UnorderedListOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: token.colorTextHeading,
          }}
        >
          本页目录
        </span>
      </div>

      {/* 目录项列表 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
        }}
      >
        {headings.map((h) => {
          const isActive = h.id === activeId;
          const isH3 = h.level === 3;

          return (
            <div
              key={h.id}
              onClick={() => scrollToHeading(h.id)}
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                padding: "6px 8px",
                paddingLeft: isH3 ? 18 : 8,
                borderRadius: token.borderRadiusSM,
                cursor: "pointer",
                color: isActive ? token.colorPrimary : token.colorTextSecondary,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? token.colorPrimaryBg : "transparent",
                borderLeft: isActive
                  ? `2px solid ${token.colorPrimary}`
                  : "2px solid transparent",
                transition: "all 0.15s ease",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              {h.text}
            </div>
          );
        })}
      </div>

      {/* 回到顶部 */}
      <div
        onClick={scrollToTop}
        style={{
          marginTop: 16,
          paddingTop: 10,
          borderTop: `1px dashed ${token.colorBorderSecondary}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: token.colorTextTertiary,
          cursor: "pointer",
          transition: "color 0.2s",
        }}
      >
        <VerticalAlignTopOutlined style={{ fontSize: 13 }} />
        <span>回到顶部</span>
      </div>
    </div>
  );
};

export default DocToc;
