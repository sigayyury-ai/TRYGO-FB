import {
  ChangeHypothesesValidationInput,
  changeHypothesesValidationMutation,
} from "@/api/changeHypothesesValidation";
import {
  regenerateHypothesesValidationMutation,
  ProjectHypothesisIdPromptPartInput,
} from "@/api/regenerateHypothesesValidation";
import { createHypothesesValidation } from "@/api/createHypothesesValidation";
import {
  getHypothesesValidationQuery,
  HypothesesValidation,
} from "@/api/getHypothesesValidation";
import { UploadValidationCustomerInterviewMutation } from "@/api/UploadHypothesesValidationCustomerInterview";
import { UploadValidationJtbdInterviewMutation } from "@/api/uploadHypothesesValidationJtbdInterview";
import { create } from "zustand";

interface ValidationState {
  hypothesesValidation: HypothesesValidation | null;
  loading: boolean;
  error: string | null;

  uploadCustomerInsightsModal: boolean;
  uploadJtbdInsightsModal: boolean;

  createHypothesesValidation: (projectHypothesisId: string) => void;
  getHypothesesValidation: (projectHypothesisId: string) => void;
  changeHypothesesValidation: (
    input: Omit<ChangeHypothesesValidationInput, "id">
  ) => Promise<void>;
  regenerateHypothesesValidation: (input: ProjectHypothesisIdPromptPartInput) => Promise<void>;
  uploadValidationCustomerInterview: (
    customerInterview: string
  ) => Promise<void>;
  // uploadValidationJtbdInterview: (jtbdInterview: string) => Promise<void>;
}

export const useValidationStore = create<ValidationState>((set, get) => ({
  hypothesesValidation: null,
  loading: false,
  error: null,
  uploadCustomerInsightsModal: false,
  uploadJtbdInsightsModal: false,

  createHypothesesValidation: async (projectHypothesisId) => {
    if (!projectHypothesisId) {
      set({ error: "Project hypothesis ID is required", loading: false });
      return;
    }

    set({ loading: true, error: null });

    try {
      // First, quickly check if data exists
      const existingCheck = await getHypothesesValidationQuery(projectHypothesisId);
      
      // If data exists, we're done
      if (existingCheck.data?.getHypothesesValidation) {
        set({ 
          hypothesesValidation: existingCheck.data.getHypothesesValidation,
          loading: false, 
          error: null 
        });
        return;
      }

      // If no data exists, create new
      const { data, error: mutationError } = await createHypothesesValidation(projectHypothesisId);

      if (mutationError) {
        // If error is "already exists", try to fetch existing data
        if (mutationError.message?.includes('already exists')) {
          await get().getHypothesesValidation(projectHypothesisId);
          set({ loading: false, error: null });
          return;
        }
        
        throw mutationError;
      }

      const hypothesesValidation = data?.createHypothesesValidation;

      if (!hypothesesValidation) {
        throw new Error('No data returned from createHypothesesValidation mutation');
      }

      set({
        hypothesesValidation,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      console.error('[useValidationStore] Error in createHypothesesValidation:', error);
      
      // If error is "already exists", try to fetch existing data
      if (error instanceof Error && error.message?.includes('already exists')) {
        try {
          await get().getHypothesesValidation(projectHypothesisId);
          set({ loading: false, error: null });
          return;
        } catch (fetchError) {
          console.error('[useValidationStore] Error fetching existing data:', fetchError);
        }
      }
      
      let errorMessage = "Failed to create hypotheses Validation Data";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  getHypothesesValidation: async (projectHypothesisId) => {
    if (!projectHypothesisId) {
      set({ hypothesesValidation: null, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data, error: queryError } = await getHypothesesValidationQuery(projectHypothesisId);
      
      if (queryError) {
        // Если это ошибка "not found" или null, просто устанавливаем null без ошибки
        if (queryError.message?.includes('not found') || queryError.message?.includes('null') || queryError.message?.includes('Cannot return null')) {
          set({
            hypothesesValidation: null,
            loading: false,
            error: null,
          });
          return;
        }
        throw queryError;
      }

      const hypothesesValidation = data?.getHypothesesValidation || null;

      set({
        hypothesesValidation,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to load hypotheses Validation Data";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Если это GraphQL ошибка "not found" или null, не показываем ошибку - просто нет данных
        if (error.message.includes('not found') || error.message.includes('Cannot return null') || error.message.includes('null')) {
          set({
            hypothesesValidation: null,
            loading: false,
            error: null,
          });
          return;
        }
      }
      console.error('[useValidationStore] Error loading validation:', error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },
  uploadValidationCustomerInterview: async (customerInterview) => {
    set({ loading: true, error: null });
    try {
      const id = get().hypothesesValidation.id;

      const { data } = await UploadValidationCustomerInterviewMutation({
        input: {
          id,
          customerInterview,
        },
      });

      const uploadHypothesesValidationCustomerInterview =
        data.uploadHypothesesValidationCustomerInterview;

      set({
        hypothesesValidation: uploadHypothesesValidationCustomerInterview,
        loading: false,
      });
      toggleUploadCustomerInsightsModal(false);
    } catch (error) {
      let errorMessage = "Failed to upload hypotheses Customer Interview";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({
        error: errorMessage,
      });
    }
  },
  // uploadValidationJtbdInterview: async (jtbdInterview) => {
  //   set({ loading: true, error: null });
  //   try {
  //     const id = get().hypothesesValidation.id;

  //     const { data } = await UploadValidationJtbdInterviewMutation({
  //       input: {
  //         id,
  //         jtbdInterview,
  //       },
  //     });
  //     const uploadHypothesesValidationJtbdInterview =
  //       data.uploadHypothesesValidationJtbdInterview;

  //     set({
  //       hypothesesValidation: uploadHypothesesValidationJtbdInterview,
  //       loading: false,
  //     });

  //     toggleUploadJtbdInsightsModal(false);
  //   } catch (error) {
  //     let errorMessage = "Failed to upload hypotheses Customer Interview";

  //     if (error instanceof Error) {
  //       errorMessage = error.message;
  //     }

  //     set({
  //       error: errorMessage,
  //     });
  //   }
  // },
  changeHypothesesValidation: async (input) => {
    try {
      const id = get().hypothesesValidation.id;

      if (!id) throw new Error("No hypothesesValidation id");

      const { data } = await changeHypothesesValidationMutation({
        input: {
          id,
          ...input,
        },
      });

      set({
        hypothesesValidation: data.changeHypothesesValidation,
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

  regenerateHypothesesValidation: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await regenerateHypothesesValidationMutation({ input });
      set({
        hypothesesValidation: data.regenerateHypothesesValidation,
        loading: false,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to regenerate validation hypotheses";
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

export const toggleUploadCustomerInsightsModal = (
  uploadCustomerInsightsModal: boolean
) => useValidationStore.setState({ uploadCustomerInsightsModal });

export const toggleUploadJtbdInsightsModal = (
  uploadJtbdInsightsModal: boolean
) => useValidationStore.setState({ uploadJtbdInsightsModal });
