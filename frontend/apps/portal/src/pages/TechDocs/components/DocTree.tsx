import React, { useMemo, useState, useEffect } from "react";
import { Input, Tag, Empty, theme } from "antd";
import {
  SearchOutlined,
  RocketOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  FileDoneOutlined,
  BookOutlined,
  DownOutlined,
  RightOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { DocCategoryVO, DocChapterVO } from "../types";

export interface DocTreeProps {
  categories: DocCategoryVO[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
  style?: React.CSSProperties;
}

const renderCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "RocketOutlined":
      return <RocketOutlined style={{ color: "#1677ff" }} />;
    case "ApartmentOutlined":
      return <ApartmentOutlined style={{ color: "#52c41a" }} />;
    case "SafetyCertificateOutlined":
      return <SafetyCertificateOutlined style={{ color: "#722ed1" }} />;
    case "ThunderboltOutlined":
      return <ThunderboltOutlined style={{ color: "#fa8c16" }} />;
    case "FileDoneOutlined":
      return <FileDoneOutlined style={{ color: "#13c2c2" }} />;
    default:
      return <BookOutlined style={{ color: "#1677ff" }} />;
  }
};

export const DocTree: React.FC<DocTreeProps> = ({
  categories,
  selectedChapterId,
  onSelectChapter,
  searchKeyword,
  onSearchChange,
  style,
}) => {
  const { token } = theme.useToken();

  // 默认展开所有分类
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  });

  // 当选择章节变化时，确保所属分类处于展开态
  useEffect(() => {
    const activeCategory = categories.find((cat) =>
      cat.chapters.some((ch) => ch.id === selectedChapterId)
    );
    if (activeCategory && !expandedCategories[activeCategory.id]) {
      setExpandedCategories((prev) => ({
        ...prev,
        [activeCategory.id]: true,
      }));
    }
  }, [selectedChapterId, categories]);

  // 切换分类展开/折叠
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 全文关键词过滤
  const filteredCategories = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return categories;

    return categories
      .map((cat) => {
        const matchingChapters = cat.chapters.filter((ch) => {
          const matchTitle = ch.title.toLowerCase().includes(keyword);
          const matchSummary = ch.summary.toLowerCase().includes(keyword);
          const matchHeadings = ch.headings.some((h) =>
            h.text.toLowerCase().includes(keyword)
          );
          return matchTitle || matchSummary || matchHeadings;
        });

        return {
          ...cat,
          chapters: matchingChapters,
        };
      })
      .filter((cat) => cat.chapters.length > 0);
  }, [categories, searchKeyword]);

  // 总篇数
  const totalChapters = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.chapters.length, 0);
  }, [categories]);

  const matchedTotal = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.chapters.length, 0);
  }, [filteredCategories]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "16px",
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* 搜索与篇数总览 */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 15, color: token.colorTextHeading }}>
              技术知识库
            </span>
          </div>
          <Tag color="blue" variant="filled" style={{ margin: 0, fontSize: 12 }}>
            {searchKeyword ? `匹配 ${matchedTotal} 篇` : `共 ${totalChapters} 篇`}
          </Tag>
        </div>

        <Input
          placeholder="搜索文档标题或知识要点..."
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          variant="filled"
          style={{ borderRadius: token.borderRadius }}
        />
      </div>

      {/* 目录列表 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {filteredCategories.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="未找到匹配的技术文档"
            style={{ margin: "32px 0" }}
          />
        ) : (
          filteredCategories.map((category) => {
            const isExpanded = searchKeyword ? true : expandedCategories[category.id] !== false;

            return (
              <div key={category.id} style={{ marginBottom: 12 }}>
                {/* 分类标题栏 */}
                <div
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: token.borderRadius,
                    cursor: "pointer",
                    userSelect: "none",
                    background: token.colorFillQuaternary,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      overflow: "hidden",
                    }}
                  >
                    {renderCategoryIcon(category.icon)}
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: token.colorTextHeading,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={category.title}
                    >
                      {category.title}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: token.colorTextSecondary,
                        background: token.colorBgContainer,
                        padding: "1px 6px",
                        borderRadius: 10,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      {category.chapters.length}
                    </span>
                    {isExpanded ? (
                      <DownOutlined style={{ fontSize: 10, color: token.colorTextTertiary }} />
                    ) : (
                      <RightOutlined style={{ fontSize: 10, color: token.colorTextTertiary }} />
                    )}
                  </div>
                </div>

                {/* 章节列表 */}
                {isExpanded && (
                  <div style={{ marginTop: 4, paddingLeft: 6 }}>
                    {category.chapters.map((chapter: DocChapterVO) => {
                      const isSelected = chapter.id === selectedChapterId;

                      return (
                        <div
                          key={chapter.id}
                          onClick={() => onSelectChapter(chapter.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            margin: "2px 0",
                            borderRadius: token.borderRadius,
                            cursor: "pointer",
                            background: isSelected
                              ? token.colorPrimaryBg
                              : "transparent",
                            borderLeft: isSelected
                              ? `3px solid ${token.colorPrimary}`
                              : "3px solid transparent",
                            transition: "all 0.15s ease-in-out",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              overflow: "hidden",
                              flex: 1,
                            }}
                          >
                            <FileTextOutlined
                              style={{
                                fontSize: 12,
                                color: isSelected
                                  ? token.colorPrimary
                                  : token.colorTextTertiary,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                color: isSelected
                                  ? token.colorPrimary
                                  : token.colorText,
                                fontWeight: isSelected ? 600 : 400,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={chapter.title}
                            >
                              {chapter.title}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                              marginLeft: 6,
                            }}
                          >
                            {chapter.badge && (
                              <Tag
                                color={
                                  chapter.badge.includes("必读")
                                    ? "red"
                                    : chapter.badge.includes("核心")
                                    ? "orange"
                                    : chapter.badge.includes("标杆")
                                    ? "purple"
                                    : "blue"
                                }
                                style={{
                                  margin: 0,
                                  fontSize: 10,
                                  lineHeight: "16px",
                                  padding: "0 4px",
                                  borderRadius: 4,
                                }}
                              >
                                {chapter.badge}
                              </Tag>
                            )}
                            <span
                              style={{
                                fontSize: 11,
                                color: token.colorTextQuaternary,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <ClockCircleOutlined style={{ fontSize: 10 }} />
                              {chapter.readTime}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DocTree;
