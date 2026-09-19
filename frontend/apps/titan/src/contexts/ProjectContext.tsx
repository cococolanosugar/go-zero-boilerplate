import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import {
  titanListProjects,
  getToken,
  type TitanListProjects200ListItem,
} from "@zero/api";
import { App } from "antd";

export interface ProjectContextValue {
  projects: TitanListProjects200ListItem[];
  currentProjectId: number | null;
  currentProject: TitanListProjects200ListItem | null;
  loading: boolean;
  setCurrentProjectId: (id: number) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = "titan_current_project_id";

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { message } = App.useApp();
  const [projects, setProjects] = useState<TitanListProjects200ListItem[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [loading, setLoading] = useState(false);

  // 竞态保护：请求序列号，仅最新请求可写入状态
  const requestSeqRef = useRef(0);
  // ref 镜像 currentProjectId：refreshProjects 不再依赖它，
  // 切换项目时不会因回调引用变化而重新拉取全量项目列表
  const currentProjectIdRef = useRef(currentProjectId);
  currentProjectIdRef.current = currentProjectId;

  const refreshProjects = useCallback(async () => {
    if (!getToken()) return;
    const seq = ++requestSeqRef.current;
    setLoading(true);
    try {
      const res = await titanListProjects({ page: 1, pageSize: 100 });
      if (seq !== requestSeqRef.current) return; // 过期响应丢弃
      const list = res.list || [];
      setProjects(list);

      // 如果当前没有选中项目，或者选中的项目不在列表中，默认选中第一个
      const current = currentProjectIdRef.current;
      if (list.length > 0) {
        if (!current || !list.some((p) => p.id === current)) {
          const firstId = list[0].id!;
          setCurrentProjectIdState(firstId);
          localStorage.setItem(STORAGE_KEY, String(firstId));
        }
      } else {
        setCurrentProjectIdState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      message.error("加载项目列表失败，请稍后重试");
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  useEffect(() => {
    if (isLoggedIn || getToken()) {
      refreshProjects();
    }
  }, [isLoggedIn, refreshProjects]);

  const setCurrentProjectId = useCallback((id: number) => {
    setCurrentProjectIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) || null,
    [projects, currentProjectId],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      currentProjectId,
      currentProject,
      loading,
      setCurrentProjectId,
      refreshProjects,
    }),
    [projects, currentProjectId, currentProject, loading, setCurrentProjectId, refreshProjects],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
};
