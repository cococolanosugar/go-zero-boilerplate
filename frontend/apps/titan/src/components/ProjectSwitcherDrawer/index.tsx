import React, { useState, useEffect, useMemo } from "react";
import { Drawer, Input, Tag, Space, Typography, Button, Empty } from "antd";
import {
  SearchOutlined,
  ProjectOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useProject } from "../../contexts/ProjectContext";
import type { TitanListProjects200ListItem } from "@zero/api";

const { Text } = Typography;

interface ProjectSwitcherDrawerProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_PROJECTS_KEY = "titan_recent_projects";

export const ProjectSwitcherDrawer: React.FC<ProjectSwitcherDrawerProps> = ({
  open,
  onClose,
}) => {
  const { projects, currentProjectId, setCurrentProjectId } = useProject();
  const [keyword, setKeyword] = useState("");
  const [recentIds, setRecentIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_PROJECTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 全局键盘快捷键 (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // 项目过滤 (名称、显示名、描述)
  const filteredProjects = useMemo(() => {
    if (!keyword.trim()) return projects;
    const lower = keyword.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(lower) ||
        p.displayName?.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower)
    );
  }, [projects, keyword]);

  // 最近访问的项目列表
  const recentProjects = useMemo(() => {
    return recentIds
      .map((id) => projects.find((p) => p.id === id))
      .filter((p): p is TitanListProjects200ListItem => Boolean(p));
  }, [recentIds, projects]);

  const handleSelect = (project: TitanListProjects200ListItem) => {
    if (!project.id) return;
    setCurrentProjectId(project.id);

    // 记录到最近访问
    const updated = [project.id, ...recentIds.filter((id) => id !== project.id)].slice(0, 5);
    setRecentIds(updated);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));

    onClose();
  };

  return (
    <Drawer
      title={
        <Space orientation="horizontal" size={8}>
          <ProjectOutlined style={{ color: "#1890ff" }} />
          <span>切换项目空间</span>
          <Tag color="default" style={{ fontSize: 11, marginLeft: 8 }}>
            Ctrl+K
          </Tag>
        </Space>
      }
      placement="left"
      size={400}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: "16px 20px" } }}
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="搜索项目名称、显示名或描述..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          autoFocus
        />
      </div>

      {!keyword && recentProjects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <ClockCircleOutlined />
            <span>最近访问</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recentProjects.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: item.id === currentProjectId ? "rgba(24, 144, 255, 0.08)" : "transparent",
                  transition: "background-color 0.2s",
                }}
                onClick={() => handleSelect(item)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {item.displayName || item.name}
                    </Text>
                    <div style={{ fontSize: 11, color: "#8c8c8c" }}>{item.name}</div>
                  </div>
                  {item.id === currentProjectId && <CheckCircleFilled style={{ color: "#1890ff" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 8 }}>
          <span>全部项目 ({filteredProjects.length})</span>
        </div>
        {filteredProjects.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配的项目空间" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredProjects.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: item.id === currentProjectId ? "rgba(24, 144, 255, 0.08)" : "transparent",
                  border: item.id === currentProjectId ? "1px solid #91d5ff" : "1px solid #f0f0f0",
                  transition: "all 0.2s",
                }}
                onClick={() => handleSelect(item)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Text strong style={{ fontSize: 14 }}>
                        {item.displayName || item.name}
                      </Text>
                      <Tag color="blue" style={{ fontSize: 11 }}>
                        {item.name}
                      </Tag>
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#8c8c8c",
                          marginTop: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.id === currentProjectId && <CheckCircleFilled style={{ color: "#1890ff", fontSize: 16 }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default ProjectSwitcherDrawer;
