import { changeHypothesesPackingMutation } from "@/api/changeHypothesesPacking";
import { createHypothesesPackingMutation } from "@/api/createHypothesesPacking";
import { getHypothesesPackingQuery, HypothesesPacking } from "@/api/getHypothesesPacking";
import {
  regenerateHypothesesPackingMutation,
  ProjectHypothesisIdPromptPartInput,
} from "@/api/regenerateHypothesesPacking";
import { create } from "zustand";

interface PackingState {
  hypothesesPacking: HypothesesPacking | null;
  loading: boolean;
  error: string | null;

  createHypothesesPacking: (projectHypothesisId: string) => void;
  getHypothesesPacking: (projectHypothesisId: string) => void;
  changeHypothesesPacking: (summaty: string) => void;
  regenerateHypothesesPacking: (input: ProjectHypothesisIdPromptPartInput) => Promise<void>;
}

export const usePackingStore = create<PackingState>((set, get) => ({
  hypothesesPacking: null,
  loading: false,
  error: null,

  createHypothesesPacking: async (projectHypothesisId) => {
    if (!projectHypothesisId) {
      set({ error: "Project hypothesis ID is required", loading: false });
      return;
    }

    set({ loading: true, error: null });

    try {
      // First, quickly check if data exists
      const existingCheck = await getHypothesesPackingQuery(projectHypothesisId);
      
      // If data exists, we're done
      if (existingCheck.data?.getHypothesesPacking) {
        set({ 
          hypothesesPacking: existingCheck.data.getHypothesesPacking,
          loading: false, 
          error: null 
        });
        return;
      }

      // If no data exists, create new
      const { data, error: mutationError } = await createHypothesesPackingMutation(
        projectHypothesisId
      );

      if (mutationError) {
        // If error is "already exists", try to fetch existing data
        if (mutationError.message?.includes('already exists')) {
          await get().getHypothesesPacking(projectHypothesisId);
          set({ loading: false, error: null });
          return;
        }
        
        throw mutationError;
      }

      const hypothesesPacking = data?.createHypothesesPacking;

      if (!hypothesesPacking) {
        throw new Error('No data returned from createHypothesesPacking mutation');
      }

      set({
        hypothesesPacking,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      console.error('[usePackingStore] Error in createHypothesesPacking:', error);
      
      // If error is "already exists", try to fetch existing data
      if (error instanceof Error && error.message?.includes('already exists')) {
        try {
          await get().getHypothesesPacking(projectHypothesisId);
          set({ loading: false, error: null });
          return;
        } catch (fetchError) {
          console.error('[usePackingStore] Error fetching existing data:', fetchError);
        }
      }
      
      let errorMessage = "Failed to create hypotheses Packing Data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  getHypothesesPacking: async (projectHypothesisId) => {
    if (!projectHypothesisId) {
      set({ hypothesesPacking: null, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data, error: queryError } = await getHypothesesPackingQuery(
        projectHypothesisId
      );
      
      if (queryError) {
        // Если это ошибка "not found" или null, просто устанавливаем null без ошибки
        if (queryError.message?.includes('not found') || queryError.message?.includes('null')) {
          set({
            hypothesesPacking: null,
            loading: false,
            error: null,
          });
          return;
        }
        throw queryError;
      }

      const hypothesesPacking = data?.getHypothesesPacking || null;

      set({
        hypothesesPacking,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load hypotheses Packing Data";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Если это GraphQL ошибка "not found" или null, не показываем ошибку - просто нет данных
        if (error.message.includes('not found') || error.message.includes('Cannot return null') || error.message.includes('null')) {
          set({
            hypothesesPacking: null,
            loading: false,
            error: null,
          });
          return;
        }
      }
      console.error('[usePackingStore] Error loading packing:', error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },
  changeHypothesesPacking: async (summary) => {
    try {
      const currentData = get().hypothesesPacking;
      if (!currentData?.id) {
        throw new Error("No packing data available to update");
      }

      const { data } = await changeHypothesesPackingMutation({
        input: {
          id: currentData.id,
          summary,
        },
      });

      // Update the state with the new data
      set({
        hypothesesPacking: data.changeHypothesesPacking,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to update hypotheses Packing Data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        error: errorMessage,
      });
    }
  },

  regenerateHypothesesPacking: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await regenerateHypothesesPackingMutation({ input });
      set({
        hypothesesPacking: data.regenerateHypothesesPacking,
        loading: false,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to regenerate packing hypotheses";
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
