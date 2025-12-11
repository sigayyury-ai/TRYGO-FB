import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getSeoAgentClustersQuery,
  SeoClusterDto,
  ClusterIntent,
} from "@/api/getSeoAgentClusters";
import { createSeoAgentClusterMutation } from "@/api/createSeoAgentCluster";
import { updateSeoAgentClusterMutation } from "@/api/updateSeoAgentCluster";
import { deleteSeoAgentClusterMutation } from "@/api/deleteSeoAgentCluster";

interface SeoAgentClustersState {
  clusters: SeoClusterDto[];
  loading: boolean;
  error: string | null;
  selectedClusterId: string | null;
  apiUnavailable: boolean; // Track if API is not available to avoid repeated requests
  
  // Actions
  getClusters: (projectId: string, hypothesisId?: string) => Promise<void>;
  createCluster: (
    projectId: string,
    hypothesisId: string | undefined,
    title: string,
    intent: ClusterIntent,
    keywords: string[]
  ) => Promise<void>;
  updateCluster: (
    id: string,
    title: string,
    intent: ClusterIntent,
    keywords: string[]
  ) => Promise<void>;
  deleteCluster: (id: string) => Promise<void>;
  setSelectedCluster: (id: string | null) => void;
  clearError: () => void;
  resetApiStatus: () => void;
}

export const useSeoAgentClustersStore = create<SeoAgentClustersState>()(
  persist(
    (set, get) => ({
      clusters: [],
      loading: false,
      error: null,
      selectedClusterId: null,
      apiUnavailable: false,

      getClusters: async (projectId: string, hypothesisId?: string) => {
        // Skip if we already know API is unavailable
        if (get().apiUnavailable) {
          console.log("Skipping clusters request - API known to be unavailable");
          return;
        }
        
        set({ loading: true, error: null });
        try {
          // Only pass hypothesisId if it's defined and not empty
          const { data } = await getSeoAgentClustersQuery(
            projectId,
            hypothesisId && hypothesisId.trim() !== "" ? hypothesisId : undefined
          );
          const clusters = data?.seoAgentClusters || [];

          set({
            clusters,
            loading: false,
          });
        } catch (error: unknown) {
          console.error("Error loading clusters:", error);
          let errorMessage = "Failed to load clusters";
          
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
          
          // Don't clear clusters if we had them before (from localStorage)
          const currentClusters = get().clusters;
          set({
            error: errorMessage,
            loading: false,
            clusters: currentClusters,
          });
        }
      },

      createCluster: async (
        projectId: string,
        hypothesisId: string | undefined,
        title: string,
        intent: ClusterIntent,
        keywords: string[]
      ) => {
        set({ loading: true, error: null });
        try {
          const { data } = await createSeoAgentClusterMutation({
            projectId,
            hypothesisId,
            title,
            intent,
            keywords,
          });

          const newCluster = data.createSeoAgentCluster;
          set((state) => ({
            clusters: [...state.clusters, newCluster],
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to create cluster";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      updateCluster: async (
        id: string,
        title: string,
        intent: ClusterIntent,
        keywords: string[]
      ) => {
        set({ loading: true, error: null });
        try {
          const { data } = await updateSeoAgentClusterMutation(id, {
            title,
            intent,
            keywords,
          });

          const updatedCluster = data.updateSeoAgentCluster;
          set((state) => ({
            clusters: state.clusters.map((c) =>
              c.id === id ? updatedCluster : c
            ),
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to update cluster";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      deleteCluster: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await deleteSeoAgentClusterMutation(id);

          set((state) => ({
            clusters: state.clusters.filter((c) => c.id !== id),
            selectedClusterId:
              state.selectedClusterId === id ? null : state.selectedClusterId,
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to delete cluster";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      setSelectedCluster: (id: string | null) => {
        set({ selectedClusterId: id });
      },

      clearError: () => {
        set({ error: null });
      },
      
      resetApiStatus: () => {
        set({ apiUnavailable: false, error: null });
      },
    }),
    {
      name: "seo-agent-clusters-storage",
      partialize: (state) => ({
        clusters: state.clusters,
        selectedClusterId: state.selectedClusterId,
      }),
    }
  )
);

