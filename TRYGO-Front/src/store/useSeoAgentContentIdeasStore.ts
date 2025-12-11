import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getSeoAgentContentIdeasQuery,
  ContentIdeaDto,
  ContentIdeaStatus,
} from "@/api/getSeoAgentContentIdeas";
import { addContentIdeaToBacklogMutation } from "@/api/addContentIdeaToBacklog";
import { dismissContentIdeaMutation } from "@/api/dismissContentIdea";
import { createCustomContentIdeaMutation, CreateCustomContentIdeaInput } from "@/api/createCustomContentIdea";
import { generateContentIdeasMutation } from "@/api/generateContentIdeas";
import { BacklogContentType } from "@/api/getSeoAgentBacklog";

interface SeoAgentContentIdeasState {
  contentIdeas: ContentIdeaDto[];
  loading: boolean;
  error: string | null;
  apiUnavailable: boolean;
  lastProjectId: string | null; // Track last loaded projectId
  lastHypothesisId: string | null; // Track last loaded hypothesisId
  
  // Actions
  getContentIdeas: (projectId: string, hypothesisId?: string) => Promise<void>;
  generateContentIdeas: (projectId: string, hypothesisId: string, category?: string) => Promise<void>;
  addToBacklog: (
    contentIdeaId: string,
    title: string,
    description?: string,
    contentType?: BacklogContentType,
    clusterId?: string
  ) => Promise<void>;
  dismissIdea: (id: string) => Promise<void>;
  createCustomIdea: (input: CreateCustomContentIdeaInput) => Promise<ContentIdeaDto | null>;
  clearError: () => void;
  resetApiStatus: () => void;
}

export const useSeoAgentContentIdeasStore = create<SeoAgentContentIdeasState>()(
  persist(
    (set, get) => ({
      contentIdeas: [],
      loading: false,
      error: null,
      apiUnavailable: false,
      lastProjectId: null,
      lastHypothesisId: null,

      generateContentIdeas: async (projectId: string, hypothesisId: string, category?: string) => {
        if (!hypothesisId) {
          throw new Error("hypothesisId is required for generating content ideas");
        }
        
        // Removed excessive logging - only log errors
        set({ loading: true, error: null });
        try {
          const newIdeas = await generateContentIdeasMutation({
            projectId,
            hypothesisId,
            category
          });
          
          // Add new ideas to existing list
          set((state) => ({
            contentIdeas: [...state.contentIdeas, ...newIdeas],
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to generate content ideas";
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

      getContentIdeas: async (projectId: string, hypothesisId?: string) => {
        if (get().apiUnavailable) {
          return;
        }
        
        // Clear old data if projectId or hypothesisId changed
        const currentProjectId = get().lastProjectId;
        const currentHypothesisId = get().lastHypothesisId;
        const normalizedHypothesisId = hypothesisId && hypothesisId.trim() !== "" ? hypothesisId : null;
        
        // Always clear old data before fetching to ensure fresh data
        // This prevents stale data from localStorage from being shown
        set({ contentIdeas: [] });
        
        set({ loading: true, error: null });
        try {
          const { data } = await getSeoAgentContentIdeasQuery(
            projectId,
            normalizedHypothesisId || undefined
          );
          const contentIdeas = data?.seoAgentContentIdeas || [];

          set({
            contentIdeas,
            loading: false,
            lastProjectId: projectId,
            lastHypothesisId: normalizedHypothesisId,
          });
        } catch (error: unknown) {
          console.error("Error loading content ideas:", error);
          let errorMessage = "Failed to load content ideas";
          let shouldMarkUnavailable = false;
          
          // Check if it's a GraphQL/Network error
          if (error && typeof error === "object") {
            // Check for network error (400, 404, etc.)
            if ("networkError" in error) {
              const networkError = (error as any).networkError;
              if (networkError?.statusCode === 400) {
                errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
                shouldMarkUnavailable = true;
                console.warn("SEO Agent API endpoint not implemented on backend yet");
              } else if (networkError?.message) {
                errorMessage = networkError.message;
                // Check if message contains 400
                if (networkError.message.includes("400") || networkError.message.includes("status code 400")) {
                  errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
                  shouldMarkUnavailable = true;
                }
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
                  shouldMarkUnavailable = true;
                }
              }
            }
            
            // Check for response error
            if ("response" in error) {
              const response = (error as any).response;
              if (response?.status === 400) {
                errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
                shouldMarkUnavailable = true;
              }
            }
          }
          
          if (error instanceof Error) {
            // If it's a 400 error, likely the API doesn't exist yet
            if (error.message.includes("400") || 
                error.message.includes("status code 400") ||
                error.message.includes("Response not successful")) {
              errorMessage = "SEO Agent API not available yet. This feature is coming soon.";
              shouldMarkUnavailable = true;
            } else if (error.message) {
              errorMessage = error.message;
            }
          }
          
          if (shouldMarkUnavailable) {
            set({ apiUnavailable: true });
          }
          
          // Don't clear content ideas if we had them before (from localStorage)
          const currentIdeas = get().contentIdeas;
          set({
            error: errorMessage,
            loading: false,
            contentIdeas: currentIdeas,
          });
        }
      },

      addToBacklog: async (
        contentIdeaId: string,
        title: string,
        description?: string,
        contentType?: BacklogContentType,
        clusterId?: string
      ) => {
        set({ loading: true, error: null });
        try {
          const idea = get().contentIdeas.find(i => i.id === contentIdeaId);
          if (!idea) {
            throw new Error('Content idea not found');
          }

          // Map ContentIdeaType to BacklogContentType (they have the same values)
          const mappedContentType: BacklogContentType = 
            contentType || 
            (idea.contentType as BacklogContentType);

          await addContentIdeaToBacklogMutation({
            contentIdeaId,
            title,
            description,
            contentType: mappedContentType,
            clusterId: clusterId || idea.clusterId,
          });

          // Update idea status
          set((state) => ({
            contentIdeas: state.contentIdeas.map(item =>
              item.id === contentIdeaId
                ? { ...item, status: ContentIdeaStatus.ADDED_TO_BACKLOG }
                : item
            ),
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to add idea to backlog";
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

      dismissIdea: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await dismissContentIdeaMutation(id);
          
          set((state) => ({
            contentIdeas: state.contentIdeas.map(item =>
              item.id === id
                ? { ...item, dismissed: true, status: ContentIdeaStatus.DISMISSED }
                : item
            ),
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Failed to dismiss idea";
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

      createCustomIdea: async (input: CreateCustomContentIdeaInput) => {
        set({ loading: true, error: null });
        try {
          const { data } = await createCustomContentIdeaMutation(input);
          const newIdea = data.createCustomContentIdea;
          
          set((state) => ({
            contentIdeas: [...state.contentIdeas, newIdea],
            loading: false,
          }));
          
          return newIdea;
        } catch (error: unknown) {
          let errorMessage = "Failed to create custom idea";
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            loading: false,
          });
          return null;
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
      name: "seo-agent-content-ideas-storage",
      partialize: (state) => ({
        contentIdeas: state.contentIdeas,
      }),
    }
  )
);

