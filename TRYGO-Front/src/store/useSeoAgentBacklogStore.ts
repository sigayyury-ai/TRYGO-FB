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

      getBacklog: async (projectId: string, hypothesisId?: string) => {
        // Skip if we already know API is unavailable
        if (get().apiUnavailable) {
          console.log("Skipping backlog request - API known to be unavailable");
          return;
        }
        
        set({ loading: true, error: null });
        try {
          // Only pass hypothesisId if it's defined and not empty
          const { data } = await getSeoAgentBacklogQuery(
            projectId,
            hypothesisId && hypothesisId.trim() !== "" ? hypothesisId : undefined
          );
          const backlogItems = data?.seoAgentBacklog || [];
          
          console.log("Backlog loaded:", backlogItems.length, "items");
          console.log("Backlog data:", backlogItems);

          set({
            backlogItems,
            loading: false,
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
          const currentItem = get().backlogItems.find(item => item.id === id);
          if (!currentItem) {
            throw new Error('Backlog item not found');
          }

          // Build input without scheduledDate for now (backend doesn't support it yet)
          const input: any = {
            title,
            description: description ?? currentItem.description,
            contentType: contentType ?? currentItem.contentType,
            status: status ?? currentItem.status,
            clusterId: clusterId ?? currentItem.clusterId,
          };
          
          // TODO: Add scheduledDate when backend supports it
          // if (scheduledDate !== undefined || currentItem.scheduledDate) {
          //   input.scheduledDate = scheduledDate !== undefined ? scheduledDate : currentItem.scheduledDate;
          // }

          const { data } = await updateSeoAgentBacklogItemMutation(id, input);

          const updatedItem = data.updateSeoAgentBacklogIdea;
          console.log('[useSeoAgentBacklogStore] Updated backlog item:', updatedItem);
          
          // Save projectId and hypothesisId for refresh before updating state
          const projectIdForRefresh = currentItem.projectId;
          const hypothesisIdForRefresh = currentItem.hypothesisId;
          
          set((state) => {
            const newItems = state.backlogItems.map(item =>
              item.id === id ? updatedItem : item
            );
            console.log('[useSeoAgentBacklogStore] Updated backlog items:', newItems.length);
            console.log('[useSeoAgentBacklogStore] Scheduled items:', newItems.filter(i => i.status === BacklogStatus.SCHEDULED).length);
            
            return {
              backlogItems: newItems,
              loading: false,
            };
          });
          
          // Refresh backlog to ensure we have latest data from server
          if (projectIdForRefresh) {
            console.log('[useSeoAgentBacklogStore] Refreshing backlog after update...');
            await get().getBacklog(projectIdForRefresh, hypothesisIdForRefresh);
          }
        } catch (error: unknown) {
          let errorMessage = "Failed to update backlog item";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
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

