import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  titanListProjects,
  getToken,
  type TitanListProjects200ListItem,
} from "@zero/api";

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
  const [projects, setProjects] = useState<TitanListProjects200ListItem[]>([]);
  const [currentProjectId, setCurrentProjectIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const refreshProjects = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const res = await titanListProjects({ page: 1, pageSize: 100 });
      const list = res.list || [];
      setProjects(list);

      // 如果当前没有选中项目，或者选中的项目不在列表中，默认选中第一个
      if (list.length > 0) {
        if (!currentProjectId || !list.some((p) => p.id === currentProjectId)) {
          const firstId = list[0].id!;
          setCurrentProjectIdState(firstId);
          localStorage.setItem(STORAGE_KEY, String(firstId));
        }
      } else {
        setCurrentProjectIdState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (isLoggedIn || getToken()) {
      refreshProjects();
    }
  }, [isLoggedIn, refreshProjects]);

  const setCurrentProjectId = (id: number) => {
    setCurrentProjectIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const currentProject = projects.find((p) => p.id === currentProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProjectId,
        currentProject,
        loading,
        setCurrentProjectId,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
};
