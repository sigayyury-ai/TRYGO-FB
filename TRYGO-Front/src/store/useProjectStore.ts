import { create } from "zustand";
import { getProjectsQuery, ProjectDto } from "@/api/getProjects";
import Cookies from "js-cookie";

interface ProjectState {
  projects: ProjectDto[];
  activeProject: ProjectDto | null;
  loading: boolean;
  error: string | null;
  getProjects: () => Promise<void>;
  setActiveProject: (projectId: string) => void;
}

const COOKIE_PROJECT_ID = "activeProjectId";

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  activeProject: null,
  loading: false,
  error: null,

  getProjects: async () => {
    // Check if token exists before making request
    const token = Cookies.get('token');
    if (!token) {
      set({ loading: false, error: null });
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (get().loading) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const { data } = await getProjectsQuery();
      const projects = data?.getProjects || [];

      // Пытаемся восстановить из cookies
      const savedProjectId = Cookies.get(COOKIE_PROJECT_ID);
      let activeProject: ProjectDto | null = null;

      if (savedProjectId) {
        // Ищем сохраненный проект в свежих данных
        const foundProject = projects.find(p => p.id === savedProjectId);
        if (foundProject) {
          activeProject = foundProject;
        } else {
          // Сохраненный проект не найден - очищаем cookie
          Cookies.remove(COOKIE_PROJECT_ID);
        }
      }

      // Если не нашли в cookies или cookies пуст, берем первый проект
      if (!activeProject && projects.length > 0) {
        activeProject = projects[0];
        // Сохраняем в cookies
        Cookies.set(COOKIE_PROJECT_ID, activeProject.id, { expires: 365 });
      }

      set({
        projects,
        activeProject,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load projects";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Error loading projects:', error);
      set({
        error: errorMessage,
        loading: false,
        projects: get().projects,
      });
    }
  },

  setActiveProject: (projectId: string) => {
    if (!projectId || projectId.trim() === "") {
      Cookies.remove(COOKIE_PROJECT_ID);
      set({ activeProject: null });
      return;
    }
    
    const project = get().projects.find((p) => p.id === projectId);
    if (project) {
      // Сохраняем в cookies
      Cookies.set(COOKIE_PROJECT_ID, projectId, { expires: 365 });
      set({ activeProject: project });
    }
  },
}));
