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
    set({ loading: true, error: null });

    try {
      const { data } = await createHypothesesValidation(projectHypothesisId);

      const hypothesesValidation = data.createHypothesesValidation;

      set({
        hypothesesValidation,
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

  getHypothesesValidation: async (projectHypothesisId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await getHypothesesValidationQuery(projectHypothesisId);
      const hypothesesValidation = data.getHypothesesValidation;

      set({
        hypothesesValidation,
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
