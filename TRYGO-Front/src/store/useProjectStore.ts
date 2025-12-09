import { create } from "zustand";
import { getProjectsQuery, ProjectDto } from "@/api/getProjects";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface ProjectState {
  projects: ProjectDto[];
  activeProject: ProjectDto | null;
  loading: boolean;
  error: string | null;
  getProjects: () => Promise<void>;
  setActiveProject: (projectId: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProject: null,
      loading: false,
      error: null,

      getProjects: async () => {
        // Check if token exists before making request
        const token = Cookies.get('token');
        if (!token) {
          console.log('No token available, skipping getProjects');
          set({ loading: false, error: null });
          return;
        }
        
        // Prevent multiple simultaneous requests
        if (get().loading) {
          console.log('Projects already loading, skipping duplicate request');
          return;
        }
        
        set({ loading: true, error: null });
        try {
          const { data } = await getProjectsQuery();
          const projects = data?.getProjects || [];

          set({
            projects,
            loading: false,
            error: null,
          });

          if (!get().activeProject && projects.length > 0) {
            set({ activeProject: projects[0] });
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to load projects";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          console.error('Error loading projects:', error);
          set({
            error: errorMessage,
            loading: false,
            // Don't clear projects on error - keep existing ones
            projects: get().projects,
          });
        }
      },

      setActiveProject: (projectId: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (project) {
          set({ activeProject: project });
        }
      },
    }),
    {
      name: "projects-storage",
      partialize: (state) => ({
        projects: state.projects,
        activeProject: state.activeProject,
      }),
    }
  )
);
