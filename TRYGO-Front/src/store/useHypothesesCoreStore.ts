import { create } from "zustand";
import {
  getHypothesesCoreQuery,
  HypothesesCoreDto,
} from "@/api/getHypothesesCore";
import {
  changeHypothesesCoreMutation,
  ChangeHypothesesCoreInput,
} from "@/api/changeHypothesesCore";
import {
  regenerateHypothesesCoreMutation,
  ProjectHypothesisIdPromptPartInput,
} from "@/api/regenerateHypothesesCore";
import { persist } from "zustand/middleware";

interface HypothesesCoreState {
  coreData: HypothesesCoreDto | null;
  loading: boolean;
  wasAutoRefreshed: boolean;
  error: string | null;

  getHypothesesCore: (projectHypothesisId: string) => Promise<void>;
  changeHypothesesCore: (input: ChangeHypothesesCoreInput) => Promise<void>;
  regenerateHypothesesCore: (input: ProjectHypothesisIdPromptPartInput) => Promise<void>;
}

export const useHypothesesCoreStore = create<HypothesesCoreState>()(
  persist(
    (set) => ({
      coreData: null,
      loading: false,
      wasAutoRefreshed: false,
      error: null,

      getHypothesesCore: async (projectHypothesisId) => {
        set({ loading: true, error: null });
        try {
          const { data } = await getHypothesesCoreQuery(projectHypothesisId);

          if (!data.getHypothesesCore) {
            throw new Error("Hypotheses core not found");
          }

          set({
            coreData: data.getHypothesesCore,
            loading: false,
          });
        } catch (error: unknown) {
          let errorMessage = "Failed to load hypotheses core";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      changeHypothesesCore: async (input) => {
        set({ error: null });
        try {
          const { data } = await changeHypothesesCoreMutation({ input });
          set({
            coreData: data.changeHypothesesCore,
            loading: false,
          });
        } catch (error: unknown) {
          let errorMessage = "Failed to update hypotheses core";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      regenerateHypothesesCore: async (input) => {
        set({ loading: true, error: null });
        try {
          const { data } = await regenerateHypothesesCoreMutation({ input });
          set({
            coreData: data.regenerateHypothesesCore,
            loading: false,
            wasAutoRefreshed: true,
          });
        } catch (error: unknown) {
          let errorMessage = "Failed to regenerate hypotheses core";
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
      name: "core-storage",
      partialize: (state) => ({
        coreData: state.coreData,
      }),
    }
  )
);
