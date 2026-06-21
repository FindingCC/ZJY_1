"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  loading: boolean;
  refreshProjects: () => Promise<Project[]>;
  apiUrl: (path: string) => string;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  currentProject: null,
  setCurrentProject: () => {},
  loading: true,
  refreshProjects: async () => [] as Project[],
  apiUrl: (path) => path,
});

export function useProject() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const retryRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/projects");
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data?.length > 0) {
          setProjects(json.data);
          const savedId = localStorage.getItem("currentProjectId");
          const found = savedId
            ? json.data.find((p: Project) => p.id === parseInt(savedId))
            : null;
          setCurrentProjectState(found || json.data[0]);
          if (!found && json.data[0]) {
            localStorage.setItem("currentProjectId", String(json.data[0].id));
          }
          setLoading(false);
          return;
        }
      } catch {}

      // 没拿到数据（可能未登录），500ms 后重试
      if (!cancelled && retryRef.current < 30) {
        retryRef.current++;
        setTimeout(load, 500);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const setCurrentProject = useCallback((project: Project) => {
    setCurrentProjectState(project);
    localStorage.setItem("currentProjectId", String(project.id));
  }, []);

  const apiUrl = useCallback(
    (path: string) => {
      if (!currentProject) return path;
      const sep = path.includes("?") ? "&" : "?";
      return `${path}${sep}projectId=${currentProject.id}`;
    },
    [currentProject]
  );

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
        return json.data as Project[];
      }
    } catch {}
    return [];
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        loading,
        refreshProjects,
        apiUrl,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
