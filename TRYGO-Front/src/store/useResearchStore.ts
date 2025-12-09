import { changeHypothesesMarketResearchMutation } from "@/api/changeHypothesesMarketResearch";
import { createHypothesesMarketResearch } from "@/api/createHypothesesMarketResearch";
import {
  getHypothesesMarketResearchQuery,
  HypothesesMarketResearch,
} from "@/api/getHypothesesMarketResearch";
import {
  regenerateHypothesesMarketResearchMutation,
  ProjectHypothesisIdPromptPartInput,
} from "@/api/regenerateHypothesesMarketResearch";
import { create } from "zustand";

interface ResearchState {
  hypothesesMarketResearchData: HypothesesMarketResearch | null;
  loading: boolean;
  error: string | null;

  createHypothesesMarketResearch: (projectHypothesisId: string) => void;
  getHypothesesMarketResearch: (projectHypothesisId: string) => void;
  changeHypothesesMarketResearch: (summaty: string) => void;
  regenerateHypothesesMarketResearch: (input: ProjectHypothesisIdPromptPartInput) => Promise<void>;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  hypothesesMarketResearchData: null,
  loading: false,
  error: null,

  createHypothesesMarketResearch: async (projectHypothesisId) => {
    set({ loading: true, error: null });

    try {
      const { data } = await createHypothesesMarketResearch(
        projectHypothesisId
      );

      const hypothesesMarketResearchData = data.createHypothesesMarketResearch;

      set({
        hypothesesMarketResearchData,
        loading: false,
      });

      // Automatically fetch the latest data after creation to ensure state is up to date
      await get().getHypothesesMarketResearch(projectHypothesisId);
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

  getHypothesesMarketResearch: async (projectHypothesisId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await getHypothesesMarketResearchQuery(
        projectHypothesisId
      );
      const hypothesesMarketResearchData = data.getHypothesesMarketResearch;

      set({
        hypothesesMarketResearchData,
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
  changeHypothesesMarketResearch: async (summary) => {
    try {
      const currentData = get().hypothesesMarketResearchData;
      if (!currentData?.id) {
        throw new Error("No research data available to update");
      }

      const { data } = await changeHypothesesMarketResearchMutation({
        input: {
          id: currentData.id,
          summary,
        },
      });

      // Update the state with the new data
      set({
        hypothesesMarketResearchData: data.changeHypothesesMarketResearch,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to update hypotheses Market Research Data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        error: errorMessage,
      });
    }
  },

  regenerateHypothesesMarketResearch: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await regenerateHypothesesMarketResearchMutation({ input });
      set({
        hypothesesMarketResearchData: data.regenerateHypothesesMarketResearch,
        loading: false,
      });

      // Automatically fetch the latest data after regeneration to ensure state is up to date
      await get().getHypothesesMarketResearch(input.projectHypothesisId);
    } catch (error: unknown) {
      let errorMessage = "Failed to regenerate market research hypotheses";
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
