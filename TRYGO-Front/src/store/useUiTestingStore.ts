import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSeoAgentUiTesting } from "@/config/featureFlags";

interface UiTestingState {
  isTesting: boolean;
  scenarioId: string | null;
  
  // Actions
  toggleTesting: () => void;
  setScenarioId: (id: string | null) => void;
  isUiTestingEnabled: () => boolean;
}

/**
 * Store for UI Testing mode
 * Controls whether to use mock data or real API calls
 */
export const useUiTestingStore = create<UiTestingState>()(
  persist(
    (set, get) => ({
      isTesting: false,
      scenarioId: null,

      toggleTesting: () => {
        const featureFlagEnabled = useSeoAgentUiTesting();
        if (!featureFlagEnabled) {
          return; // Don't allow toggling if feature flag is disabled
        }
        set((state) => ({ isTesting: !state.isTesting }));
      },

      setScenarioId: (id: string | null) => {
        set({ scenarioId: id });
      },

      isUiTestingEnabled: () => {
        // Note: This is called inside the store, so we can't use the hook directly
        // We'll check the feature flag at the component level instead
        return get().isTesting;
      },
    }),
    {
      name: "ui-testing-storage",
      partialize: (state) => ({
        isTesting: state.isTesting,
        scenarioId: state.scenarioId,
      }),
    }
  )
);

