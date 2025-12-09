import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getProjectHypothesesQuery,
  ProjectHypothesis,
} from "@/api/getProjectHypotheses";
import {
  changeProjectHypothesisMutation,
  ChangeProjectHypothesisInput,
} from "@/api/changeProjectHypothesis";
import { deleteProjectHypothesisMutation } from "@/api/deleteProjectHypothesis";
import { useHypothesesCoreStore } from "./useHypothesesCoreStore";
import { useProjectStore } from "./useProjectStore";

interface HypothesisState {
  hypotheses: ProjectHypothesis[];
  activeHypothesis: ProjectHypothesis | null;
  loading: boolean;
  error: string | null;

  getHypotheses: (projectId: string) => Promise<void>;
  setActiveHypothesis: (hypothesisId: string) => void;
  changeHypothesis: (input: ChangeProjectHypothesisInput) => Promise<void>;
  deleteHypothesis: (id: string) => Promise<void>;
}

export const useHypothesisStore = create<HypothesisState>()(
  persist(
    (set, get) => ({
      hypotheses: [],
      activeHypothesis: null,
      loading: false,
      error: null,

      getHypotheses: async (projectId) => {
        set({ loading: true, error: null });
        try {
          const { data } = await getProjectHypothesesQuery(projectId);
          const hypotheses = data.getProjectHypotheses || [];

          // Перевіряємо чи проект новостворений і чи прийшов порожній масив гіпотез
          if (hypotheses.length === 0) {
            const projects = useProjectStore.getState().projects;
            const currentProject = projects.find(p => p.id === projectId);
            
            // Якщо проект новий (створений менше 5 хвилин тому) і гіпотез немає
            if (currentProject && currentProject.createdAt) {
              const projectAge = Date.now() - new Date(currentProject.createdAt).getTime();
              const fiveMinutes = 5 * 60 * 1000;
              
              if (projectAge < fiveMinutes) {
                // Це новий проект без гіпотез - це помилка генерації
                set({
                  hypotheses: [],
                  loading: false,
                  error: "Unfortunately something went wrong with project generation, попробуйте создать новый аккаунт",
                  activeHypothesis: null,
                });
                return;
              }
            }
          }

          set({
            hypotheses,
            loading: false,
          });

          // Always select the first hypothesis when loading hypotheses for a project
          // This ensures that when switching projects, the first hypothesis is auto-selected
          if (hypotheses.length > 0) {
            const currentActiveHypothesis = get().activeHypothesis;
            const isActiveHypothesisInCurrentProject = currentActiveHypothesis && 
              hypotheses.some(h => h.id === currentActiveHypothesis.id);
            
            // If no active hypothesis or active hypothesis doesn't belong to current project,
            // select the first hypothesis
            if (!currentActiveHypothesis || !isActiveHypothesisInCurrentProject) {
              set({ activeHypothesis: hypotheses[0] });
            }
          } else {
            // Clear active hypothesis if no hypotheses exist
            set({ activeHypothesis: null });
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to load hypotheses";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      setActiveHypothesis: (hypothesisId) => {
        const hypothesis = get().hypotheses.find((h) => h.id === hypothesisId);
        if (hypothesis) {
          set({ activeHypothesis: hypothesis });
        }
      },

      changeHypothesis: async (input) => {
        set({ loading: true, error: null });
        try {
          const { data } = await changeProjectHypothesisMutation({
            input: {
              id: input.id,
              title: input.title,
              description: input.description,
            },
          });

          const updatedHypothesis = data.changeProjectHypothesis;

          set((state) => ({
            hypotheses: state.hypotheses.map((h) =>
              h.id === input.id ? updatedHypothesis : h
            ),
            loading: false,
          }));

          if (get().activeHypothesis?.id === input.id) {
            set({ activeHypothesis: updatedHypothesis });
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to update hypothesis";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      deleteHypothesis: async (id) => {
        set({ loading: true, error: null });
        try {
          await deleteProjectHypothesisMutation({
            deleteProjectHypothesisId: id,
          });

          set((state) => ({
            hypotheses: state.hypotheses.filter((h) => h.id !== id),
            loading: false,
          }));

          if (get().activeHypothesis?.id === id) {
            const firstHypothesis = get().hypotheses[0];
            set({ activeHypothesis: firstHypothesis || null });
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to delete hypothesis";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },
    }),
    {
      name: "hypothesis-storage",
      partialize: (state) => ({
        hypotheses: state.hypotheses,
        activeHypothesis: state.activeHypothesis,
      }),
    }
  )
);
