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
    set({ loading: true, error: null });

    try {
      const { data } = await createHypothesesPackingMutation(
        projectHypothesisId
      );

      const hypothesesPacking = data.createHypothesesPacking;

      set({
        hypothesesPacking,
        loading: false,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load hypotheses Market Research Data";
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
    set({ loading: true, error: null });
    try {
      const { data } = await getHypothesesPackingQuery(
        projectHypothesisId
      );
      const hypothesesPacking = data.getHypothesesPacking;

      set({
        hypothesesPacking,
        loading: false,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load hypotheses Market Research Data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },
  changeHypothesesPacking: async (summary) => {
    try {
      const id = get().hypothesesPacking.id;

      await changeHypothesesPackingMutation({
        input: {
          id,
          summary,
        },
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load hypotheses Market Research Data";
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
