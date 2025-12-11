import { create } from 'zustand';
import {
  HypothesesMarketResearchDto,
  getHypothesesMarketResearchQuery,
  changeHypothesesMarketResearchMutation,
  ChangeHypothesesMarketResearchInput,
} from '@/api/hypothesesMarketResearch';
import {
  regenerateHypothesesMarketResearchMutation,
  ProjectHypothesisIdPromptPartInput,
} from '@/api/regenerateHypothesesMarketResearch';

interface HypothesesMarketResearchState {
  researchData: HypothesesMarketResearchDto | null;
  loading: boolean;
  error: string | null;

  getResearchData: (projectHypothesisId: string) => Promise<void>;
  changeResearchData: (
    input: ChangeHypothesesMarketResearchInput
  ) => Promise<void>;
  regenerateHypothesesMarketResearch: (input: ProjectHypothesisIdPromptPartInput) => Promise<void>;
}

export const useHypothesesMarketResearchStore =
  create<HypothesesMarketResearchState>((set) => ({
    researchData: null,
    loading: false,
    error: null,

    getResearchData: async (projectHypothesisId: string) => {
      set({ loading: true, error: null });
      try {
        const { data } = await getHypothesesMarketResearchQuery(
          projectHypothesisId
        );
        set({
          researchData: data.getHypothesesMarketResearch,
          loading: false,
        });
      } catch (error: unknown) {
        let errorMessage = 'Failed to load market research data';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        set({
          error: errorMessage,
          loading: false,
        });
      }
    },

    changeResearchData: async (input: ChangeHypothesesMarketResearchInput) => {
      set({ loading: true });
      try {
        const { data } = await changeHypothesesMarketResearchMutation({
          input,
        });
        set({
          researchData: data.changeHypothesesMarketResearch,
          loading: false,
        });
      } catch (error: unknown) {
        let errorMessage = 'Failed to update research data';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        set({
          error: errorMessage,
          loading: false,
        });
        throw error;
      }
    },

    regenerateHypothesesMarketResearch: async (input) => {
      set({ loading: true, error: null });
      try {
        const { data } = await regenerateHypothesesMarketResearchMutation({ input });
        set({
          researchData: data.regenerateHypothesesMarketResearch,
          loading: false,
        });
      } catch (error: unknown) {
        let errorMessage = 'Failed to regenerate market research hypotheses';
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
