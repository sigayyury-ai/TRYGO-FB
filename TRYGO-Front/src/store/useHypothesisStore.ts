import { create } from "zustand";
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
import Cookies from "js-cookie";

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

const COOKIE_HYPOTHESIS_ID = "activeHypothesisId";

export const useHypothesisStore = create<HypothesisState>()((set, get) => ({
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
        if (currentProject && (currentProject as any).createdAt) {
          const projectAge = Date.now() - new Date((currentProject as any).createdAt).getTime();
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

      // Восстанавливаем из cookies
      const savedHypothesisId = Cookies.get(COOKIE_HYPOTHESIS_ID);
      let activeHypothesis: ProjectHypothesis | null = null;

      if (savedHypothesisId) {
        // Ищем сохраненную гипотезу в свежих данных из API
        const foundHypothesis = hypotheses.find(h => h.id === savedHypothesisId && h.projectId === projectId);
        if (foundHypothesis) {
          activeHypothesis = foundHypothesis;
        } else {
          // Сохраненная гипотеза не найдена или принадлежит другому проекту - очищаем cookie
          Cookies.remove(COOKIE_HYPOTHESIS_ID);
        }
      }

      // Если не нашли в cookies или cookies пуст, берем первую гипотезу
      if (!activeHypothesis && hypotheses.length > 0) {
        activeHypothesis = hypotheses[0];
        // Сохраняем в cookies
        Cookies.set(COOKIE_HYPOTHESIS_ID, activeHypothesis.id, { expires: 365 });
      }

      set({
        hypotheses,
        activeHypothesis,
        loading: false,
      });
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
    if (!hypothesisId || hypothesisId.trim() === "") {
      Cookies.remove(COOKIE_HYPOTHESIS_ID);
      set({ activeHypothesis: null });
      return;
    }
    
    const hypothesis = get().hypotheses.find((h) => h.id === hypothesisId);
    if (hypothesis) {
      // Сохраняем в cookies
      Cookies.set(COOKIE_HYPOTHESIS_ID, hypothesisId, { expires: 365 });
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
        if (firstHypothesis) {
          Cookies.set(COOKIE_HYPOTHESIS_ID, firstHypothesis.id, { expires: 365 });
          set({ activeHypothesis: firstHypothesis });
        } else {
          Cookies.remove(COOKIE_HYPOTHESIS_ID);
          set({ activeHypothesis: null });
        }
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
}));
