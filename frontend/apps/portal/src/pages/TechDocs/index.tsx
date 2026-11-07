import React, { useState, useEffect, useMemo } from "react";
import { Grid, Button, Drawer, Space, Tag, theme } from "antd";
import {
  BookOutlined,
  MenuOutlined,
  GithubOutlined,
  ThunderboltOutlined,
  ClusterOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  TECH_DOCS_DATA,
  findChapterById,
  getAdjacentChapters,
} from "./docsData";
import { DocTree } from "./components/DocTree";
import { DocViewer } from "./components/DocViewer";
import { DocToc } from "./components/DocToc";

export const TechDocsPage: React.FC = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.lg ?? true;
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialChapterId = searchParams.get("chapter") || "quick-start";

  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // 同步 URL 参数
  useEffect(() => {
    const urlChapter = searchParams.get("chapter");
    if (urlChapter && urlChapter !== selectedChapterId) {
      setSelectedChapterId(urlChapter);
    }
  }, [searchParams, selectedChapterId]);

  // 获取当前章节实体
  const currentChapter = useMemo(() => {
    return findChapterById(selectedChapterId);
  }, [selectedChapterId]);

  // 获取所属分类名称
  const currentCategoryTitle = useMemo(() => {
    return (
      TECH_DOCS_DATA.find((cat) =>
        cat.chapters.some((ch) => ch.id === currentChapter.id)
      )?.title || ""
    );
  }, [currentChapter]);

  // 前后篇计算
  const { prev, next } = useMemo(() => {
    return getAdjacentChapters(currentChapter.id);
  }, [currentChapter]);

  // 选择章节并同步
  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSearchParams({ chapter: chapterId });
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageContainer
      header={{
        title: "技术文档与架构决策 (TechDocs & ADR)",
        subTitle: "企业级 Fullstack Monorepo 微服务架构开发规范、治理体系与 ADR 决策记录中心",
        tags: [
          <Tag key="tag-version" color="purple">
            go-zero v1.10.3
          </Tag>,
          <Tag key="tag-front" color="blue">
            Ant Design 6.x
          </Tag>,
          <Tag key="tag-arch" color="green">
            Fullstack Monorepo
          </Tag>,
        ],
        extra: [
          <Button
            key="services"
            icon={<ClusterOutlined />}
            onClick={() => navigate("/services")}
          >
            服务治理拓扑
          </Button>,
          <Button
            key="apihub"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate("/api-hub")}
          >
            API 契约集市
          </Button>,
          <Button
            key="github"
            type="primary"
            icon={<GithubOutlined />}
            onClick={() =>
              window.open(
                "https://github.com/zeromicro/go-zero-boilerplate",
                "_blank"
              )
            }
          >
            GitHub 源码
          </Button>,
        ],
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        {/* 移动端/小屏顶栏导航控制条 */}
        {!isDesktop && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              padding: "10px 16px",
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Space>
              <Button
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
              >
                文档目录
              </Button>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: token.colorTextHeading,
                }}
              >
                {currentChapter.title}
              </span>
            </Space>

            <Tag color="cyan">{currentCategoryTitle.split(" ")[0]}</Tag>
          </div>
        )}

        {/* 响应式文档阅读器主体 */}
        {isDesktop ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              minHeight: "calc(100vh - 240px)",
            }}
          >
            {/* 左侧：分类与章节目录树 (280px) */}
            <div
              style={{
                width: 280,
                flexShrink: 0,
                position: "sticky",
                top: 80,
                maxHeight: "calc(100vh - 120px)",
              }}
            >
              <DocTree
                categories={TECH_DOCS_DATA}
                selectedChapterId={selectedChapterId}
                onSelectChapter={handleSelectChapter}
                searchKeyword={searchKeyword}
                onSearchChange={setSearchKeyword}
                style={{ maxHeight: "calc(100vh - 120px)" }}
              />
            </div>

            {/* 中间：结构化正文阅读区 (Flex 1) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <DocViewer
                chapter={currentChapter}
                categoryTitle={currentCategoryTitle}
                prevChapter={prev}
                nextChapter={next}
                onNavigateChapter={handleSelectChapter}
              />
            </div>

            {/* 右侧：页内大纲 TOC (220px) */}
            <div
              style={{
                width: 220,
                flexShrink: 0,
              }}
            >
              <DocToc headings={currentChapter.headings} />
            </div>
          </div>
        ) : (
          /* 移动端/平板单列渲染 */
          <div>
            <DocViewer
              chapter={currentChapter}
              categoryTitle={currentCategoryTitle}
              prevChapter={prev}
              nextChapter={next}
              onNavigateChapter={handleSelectChapter}
            />

            {/* 移动端左侧抽屉 */}
            <Drawer
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOutlined style={{ color: token.colorPrimary }} />
                  <span>技术文档知识库</span>
                </div>
              }
              placement="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              styles={{
                body: { padding: 12 },
              }}
            >
              <DocTree
                categories={TECH_DOCS_DATA}
                selectedChapterId={selectedChapterId}
                onSelectChapter={handleSelectChapter}
                searchKeyword={searchKeyword}
                onSearchChange={setSearchKeyword}
                style={{ border: "none", padding: 0 }}
              />
            </Drawer>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TechDocsPage;
