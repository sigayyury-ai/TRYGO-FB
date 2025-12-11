import { create } from "zustand";
import { getSeoAgentContextQuery, SeoAgentContextDto } from "@/api/getSeoAgentContext";

interface SeoAgentContextState {
  context: SeoAgentContextDto | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  getContext: (projectId: string, hypothesisId?: string) => Promise<void>;
  clearContext: () => void;
  clearError: () => void;
}

export const useSeoAgentContextStore = create<SeoAgentContextState>()(
  (set) => ({
    context: null,
    loading: false,
    error: null,

    getContext: async (projectId: string, hypothesisId?: string) => {
      set({ loading: true, error: null });
      try {
        const { data } = await getSeoAgentContextQuery(projectId, hypothesisId);
        const context = data.seoAgentContext;

        set({
          context,
          loading: false,
        });
      } catch (error: unknown) {
        let errorMessage = "Failed to load SEO Agent context";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        set({
          error: errorMessage,
          loading: false,
          context: null,
        });
      }
    },

    clearContext: () => {
      set({ context: null });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);






