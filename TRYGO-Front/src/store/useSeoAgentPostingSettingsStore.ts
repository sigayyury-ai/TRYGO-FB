import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getSeoAgentPostingSettingsQuery,
  PostingSettingsDto,
} from "@/api/getSeoAgentPostingSettings";
import { updateSeoAgentPostingSettingsMutation } from "@/api/updateSeoAgentPostingSettings";

interface SeoAgentPostingSettingsState {
  settings: PostingSettingsDto | null;
  loading: boolean;
  error: string | null;
  apiUnavailable: boolean; // Track if API is not available to avoid repeated requests
  
  // Draft state for unsaved changes
  draftSettings: {
    weeklyPublishCount: number;
    preferredDays: string[];
    autoPublishEnabled: boolean;
  } | null;
  
  // Actions
  getSettings: (projectId: string) => Promise<void>;
  updateSettings: (
    projectId: string,
    hypothesisId: string | undefined,
    weeklyPublishCount: number,
    preferredDays: string[],
    autoPublishEnabled: boolean
  ) => Promise<void>;
  setDraftSettings: (
    weeklyPublishCount: number,
    preferredDays: string[],
    autoPublishEnabled: boolean
  ) => void;
  clearDraftSettings: () => void;
  clearError: () => void;
  resetApiStatus: () => void;
}

const defaultSettings = {
  weeklyPublishCount: 2,
  preferredDays: ["Tuesday", "Thursday"],
  autoPublishEnabled: false,
};

export const useSeoAgentPostingSettingsStore =
  create<SeoAgentPostingSettingsState>()(
    persist(
      (set, get) => ({
        settings: null,
        loading: false,
        error: null,
        apiUnavailable: false,
        draftSettings: null,

        getSettings: async (projectId: string) => {
          // Skip if we already know API is unavailable
          if (get().apiUnavailable) {
            console.log("Skipping settings request - API known to be unavailable");
            // Use default settings
            set({ 
              draftSettings: defaultSettings,
              loading: false 
            });
            return;
          }
          
          set({ loading: true, error: null });
          try {
            const { data } = await getSeoAgentPostingSettingsQuery(projectId);
            const settings = data.seoAgentPostingSettings;

            set({
              settings,
              loading: false,
              // Initialize draft with current settings
              draftSettings: settings
                ? {
                    weeklyPublishCount: settings.weeklyPublishCount,
                    preferredDays: settings.preferredDays,
                    autoPublishEnabled: settings.autoPublishEnabled,
                  }
                : defaultSettings,
            });
          } catch (error: unknown) {
            console.error("Error loading posting settings:", error);
            let errorMessage = "Failed to load settings";
            let is400Error = false;
            
            // Check if it's a GraphQL/Network error
            if (error && typeof error === "object") {
              if ("networkError" in error) {
                const networkError = (error as any).networkError;
                if (networkError?.statusCode === 400) {
                  errorMessage = "SEO Agent API not available yet. Using default settings.";
                  console.warn("SEO Agent API endpoint not implemented on backend yet");
                  is400Error = true;
                }
              }
            }
            
            if (error instanceof Error) {
              if (error.message.includes("400") || error.message.includes("status code 400")) {
                errorMessage = "SEO Agent API not available yet. Using default settings.";
                is400Error = true;
              } else if (error.message) {
                errorMessage = error.message;
              }
            }
            
            set({
              error: is400Error ? null : errorMessage, // Don't show error for 400, just use defaults
              loading: false,
              settings: null,
              apiUnavailable: is400Error,
              // Use default settings if API is not available
              draftSettings: defaultSettings,
            });
          }
        },

        updateSettings: async (
          projectId: string,
          hypothesisId: string | undefined,
          weeklyPublishCount: number,
          preferredDays: string[],
          autoPublishEnabled: boolean
        ) => {
          set({ loading: true, error: null });
          try {
            const { data } = await updateSeoAgentPostingSettingsMutation({
              projectId,
              hypothesisId,
              weeklyPublishCount,
              preferredDays,
              autoPublishEnabled,
            });

            const updatedSettings = data.updateSeoAgentPostingSettings;
            set({
              settings: updatedSettings,
              draftSettings: {
                weeklyPublishCount: updatedSettings.weeklyPublishCount,
                preferredDays: updatedSettings.preferredDays,
                autoPublishEnabled: updatedSettings.autoPublishEnabled,
              },
              loading: false,
            });
          } catch (error: unknown) {
            let errorMessage = "Failed to update settings";
            if (error instanceof Error) {
              errorMessage = error.message;
            }
            set({
              error: errorMessage,
              loading: false,
            });
          }
        },

        setDraftSettings: (
          weeklyPublishCount: number,
          preferredDays: string[],
          autoPublishEnabled: boolean
        ) => {
          set({
            draftSettings: {
              weeklyPublishCount,
              preferredDays,
              autoPublishEnabled,
            },
          });
        },

        clearDraftSettings: () => {
          const currentSettings = get().settings;
          set({
            draftSettings: currentSettings
              ? {
                  weeklyPublishCount: currentSettings.weeklyPublishCount,
                  preferredDays: currentSettings.preferredDays,
                  autoPublishEnabled: currentSettings.autoPublishEnabled,
                }
              : defaultSettings,
          });
        },

        clearError: () => {
          set({ error: null });
        },
        
        resetApiStatus: () => {
          set({ apiUnavailable: false, error: null });
        },
      }),
      {
        name: "seo-agent-posting-settings-storage",
        partialize: (state) => ({
          settings: state.settings,
        }),
      }
    )
  );

