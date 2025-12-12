import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getSeoAgentBacklogQuery,
  BacklogIdeaDto,
  BacklogContentType,
  BacklogStatus,
} from "@/api/getSeoAgentBacklog";
import { updateSeoAgentBacklogItemMutation } from "@/api/updateSeoAgentBacklogItem";
import { deleteSeoAgentBacklogItemMutation } from "@/api/deleteSeoAgentBacklogItem";

interface SeoAgentBacklogState {
  backlogItems: BacklogIdeaDto[];
  loading: boolean;
  error: string | null;
  apiUnavailable: boolean; // Track if API is not available to avoid repeated requests
  lastProjectId: string | null; // Track last loaded projectId
  lastHypothesisId: string | null; // Track last loaded hypothesisId
  
  // Actions
  getBacklog: (projectId: string, hypothesisId?: string) => Promise<void>;
  updateBacklogItem: (
    id: string,
    title: string,
    description?: string,
    contentType?: BacklogContentType,
    status?: BacklogStatus,
    clusterId?: string,
    scheduledDate?: string
  ) => Promise<void>;
  deleteBacklogItem: (id: string) => Promise<void>;
  clearError: () => void;
  resetApiStatus: () => void;
}

export const useSeoAgentBacklogStore = create<SeoAgentBacklogState>()(
  persist(
    (set, get) => ({
      backlogItems: [],
      loading: false,
      error: null,
      apiUnavailable: false,
      lastProjectId: null,
      lastHypothesisId: null,

      getBacklog: async (projectId: string, hypothesisId?: string) => {
        // Skip if we already know API is unavailable
        if (get().apiUnavailable) {
          return;
        }
        
        // Clear old data if projectId or hypothesisId changed
        const currentProjectId = get().lastProjectId;
        const currentHypothesisId = get().lastHypothesisId;
        const normalizedHypothesisId = hypothesisId && hypothesisId.trim() !== "" ? hypothesisId : null;
        
        if (currentProjectId !== projectId || currentHypothesisId !== normalizedHypothesisId) {
          // Different project/hypothesis - clear old data
          set({ backlogItems: [] });
        }
        
        set({ loading: true, error: null });
        try {
          // Only pass hypothesisId if it's defined and not empty
          const { data } = await getSeoAgentBacklogQuery(
            projectId,
            normalizedHypothesisId || undefined
          );
          const backlogItems = data?.seoAgentBacklog || [];

          set({
            backlogItems,
            loading: false,
            lastProjectId: projectId,
            lastHypothesisId: normalizedHypothesisId,
          });
        } catch (error: unknown) {
          console.error("Error loading backlog:", error);
          let errorMessage = "Failed to load backlog";
          
          // Check if it's a GraphQL/Network error
          if (error && typeof error === "object") {
            // Check for network error (400, 404, etc.)
            if ("networkError" in error) {
              const networkError = (error as any).networkError;
              if (networkError?.statusCode === 400) {
                errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
                console.warn("SEO Agent API endpoint not implemented on backend yet");
                // Mark API as unavailable to avoid repeated requests
                set({ apiUnavailable: true });
              } else if (networkError?.message) {
                errorMessage = networkError.message;
              }
            }
            
            // Check for GraphQL errors
            if ("graphQLErrors" in error) {
              const graphQLErrors = (error as any).graphQLErrors;
              if (graphQLErrors?.length > 0) {
                const graphQLError = graphQLErrors[0];
                if (graphQLError?.message) {
                  errorMessage = graphQLError.message;
                }
                // Check for "Cannot query field" error - means schema doesn't have this field
                if (graphQLError?.message?.includes("Cannot query field")) {
                  errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
                }
              }
            }
          }
          
          if (error instanceof Error) {
            // If it's a 400 error, likely the API doesn't exist yet
            if (error.message.includes("400") || error.message.includes("status code 400")) {
              errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
              // Mark API as unavailable to avoid repeated requests
              set({ apiUnavailable: true });
            } else if (error.message) {
              errorMessage = error.message;
            }
          }
          
          // Don't clear backlog items if we had them before (from localStorage)
          const currentItems = get().backlogItems;
          set({
            error: errorMessage,
            loading: false,
            backlogItems: currentItems,
          });
        }
      },

      updateBacklogItem: async (
        id: string,
        title: string,
        description?: string,
        contentType?: BacklogContentType,
        status?: BacklogStatus,
        clusterId?: string,
        scheduledDate?: string
      ) => {
        set({ loading: true, error: null });
        try {
          let currentItem = get().backlogItems.find(item => item.id === id);
          
          // If item not found in store, try to refresh from server
          if (!currentItem) {
            // Try to get projectId and hypothesisId from last loaded data
            const lastProjectId = get().lastProjectId;
            const lastHypothesisId = get().lastHypothesisId;
            
            if (lastProjectId) {
              // Refresh backlog from server
              await get().getBacklog(lastProjectId, lastHypothesisId || undefined);
              // Try to find item again after refresh
              currentItem = get().backlogItems.find(item => item.id === id);
            }
            
            // If still not found, we can still try to update using provided data
            if (!currentItem) {
              // Build input from provided parameters only
              // NOTE: SeoAgentBacklogIdeaInput only supports: title, description, category, status, scheduledDate
              const input: any = {
                title,
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(scheduledDate !== undefined && { scheduledDate: scheduledDate || null }),
              };
              
              // Try to update anyway - server might have the item
              const { data } = await updateSeoAgentBacklogItemMutation(id, input);
              const updatedItem = data.updateSeoAgentBacklogIdea;
              
              // Add to store if update was successful
              set((state) => ({
                backlogItems: state.backlogItems.some(item => item.id === id)
                  ? state.backlogItems.map(item => item.id === id ? updatedItem : item)
                  : [...state.backlogItems, updatedItem],
                loading: false,
              }));
              
              // Refresh backlog to ensure consistency
              if (lastProjectId) {
                await get().getBacklog(lastProjectId, lastHypothesisId || undefined);
              }
              
              return;
            }
          }

          // Build input with scheduledDate support
          // NOTE: SeoAgentBacklogIdeaInput only supports: title, description, category, status, scheduledDate
          // contentType and clusterId are not part of the input type
          const input: any = {
            title,
            description: description ?? currentItem.description,
            status: status ?? currentItem.status,
          };
          
          // Add scheduledDate if provided or if clearing it
          if (scheduledDate !== undefined) {
            input.scheduledDate = scheduledDate || null;
          } else if (currentItem.scheduledDate && status === BacklogStatus.SCHEDULED) {
            // Keep existing scheduledDate if status is SCHEDULED
            input.scheduledDate = currentItem.scheduledDate;
          } else if (status !== BacklogStatus.SCHEDULED) {
            // Clear scheduledDate if status is not SCHEDULED
            input.scheduledDate = null;
          }

          const { data } = await updateSeoAgentBacklogItemMutation(id, input);
          const updatedItem = data.updateSeoAgentBacklogIdea;
          
          // Save projectId and hypothesisId for refresh before updating state
          const projectIdForRefresh = currentItem.projectId;
          const hypothesisIdForRefresh = currentItem.hypothesisId;
          
          // Update local state immediately with the updated item
          set((state) => ({
            backlogItems: state.backlogItems.map(item =>
              item.id === id ? updatedItem : item
            ),
            loading: false,
          }));
          
          // Refresh backlog to ensure we have latest data from server
          // This is critical to ensure the item appears in the correct panel (backlog vs sprint)
          if (projectIdForRefresh) {
            await get().getBacklog(projectIdForRefresh, hypothesisIdForRefresh);
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to update backlog item";
          if (error instanceof Error) {
            errorMessage = error.message;
            console.error('[useSeoAgentBacklogStore] Error updating backlog item:', error);
          }
          
          set({
            error: errorMessage,
            loading: false,
          });
          throw error; // Re-throw to allow caller to handle
        }
      },

      deleteBacklogItem: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await deleteSeoAgentBacklogItemMutation(id);
          set((state) => ({
            backlogItems: state.backlogItems.filter(item => item.id !== id),
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to delete backlog item";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
      
      resetApiStatus: () => {
        set({ apiUnavailable: false, error: null });
      },
    }),
    {
      name: "seo-agent-backlog-storage",
      partialize: (state) => ({
        backlogItems: state.backlogItems,
      }),
    }
  )
);

export { BacklogContentType, BacklogStatus };

