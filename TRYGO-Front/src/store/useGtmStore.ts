import { changeHypothesesGtmMutation } from "@/api/changeHypothesesGtm";
import { createHypothesesGtmMutation } from "@/api/createHypothesesGtm";
import {
  regenerateHypothesesGtmMutation,
  ProjectHypothesisIdPromptPartInput,
} from "@/api/regenerateHypothesesGtm";
import {
  ChannelsType,
  getHypothesesGtmQuery,
  HypothesesGtm,
  StageType,
  StatusType,
} from "@/api/getHypothesesGtm";
import { create } from "zustand";

function removeTypename<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeTypename) as unknown as T;
  } else if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (key !== "__typename") {
        newObj[key] = removeTypename((obj as any)[key]);
      }
    }
    return newObj;
  }
  return obj;
}

function sanitizeStage(stage: StageType) {
  return {
    name: stage.name,
    channels: stage.channels.map((ch) => {
      return {
        id: ch.id,
        name: ch.name,
        type: ch.type,
        description: ch.description,
        kpis: ch.kpis, 
        status: ch.status as StatusType,
        strategy: ch.strategy,
      };
    }),
  };
}

export type StageNameType = "Validate" | "Build Audience" | "Scale";
export type StageKeyType =
  | "stageValidate"
  | "stageBuildAudience"
  | "stageScale";

interface GtmState {
  hypothesesGtm: HypothesesGtm | null;
  loading: boolean;
  error: string | null;

  createHypothesesGtm: (projectHypothesisId: string) => void;
  getHypothesesGtm: (projectHypothesisId: string) => void;
  regenerateHypothesesGtm: (input: ProjectHypothesisIdPromptPartInput) => Promise<void>;
  handleChangeStatus: (
    stageKey: StageKeyType,
    channelId: string,
    newStatus: StatusType
  ) => Promise<void>;
  handleUpdateChannelField: (
    stageKey: StageKeyType,
    channelId: string,
    field: keyof ChannelsType,
    value: any
  ) => Promise<void>;
  // changeHypothesesGtm: (summaty: string) => void;
}

export const useGtmStore = create<GtmState>((set, get) => ({
  hypothesesGtm: null,
  loading: false,
  error: null,

  createHypothesesGtm: async (projectHypothesisId) => {
    set({ loading: true, error: null });

    try {
      const { data } = await createHypothesesGtmMutation(projectHypothesisId);

      const hypothesesGtm = data.createHypothesesGtm;

      set({
        hypothesesGtm,
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

  getHypothesesGtm: async (projectHypothesisId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await getHypothesesGtmQuery(projectHypothesisId);
      const hypothesesGtm = data.getHypothesesGtm;

      set({
        hypothesesGtm,
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
  handleChangeStatus: async (stageKey, channelId, newStatus) => {
    const { hypothesesGtm } = get();

    if (!hypothesesGtm) return;

    try {
      const stage = hypothesesGtm[stageKey];
      if (!stage) return;

      const updatedChannels = stage.channels.map((ch) =>
        String(ch.id) === String(channelId) ? { ...ch, status: newStatus } : ch
      );
      const input = {
        id: hypothesesGtm.id,
        [stageKey]: sanitizeStage({ ...stage, channels: updatedChannels }),
      };

      const { data } = await changeHypothesesGtmMutation({ input });
      if (data?.changeHypothesesGtm) {
        set({ hypothesesGtm: data.changeHypothesesGtm });
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to change GTM status";
      if (error instanceof Error) errorMessage = error.message;
      set({ error: errorMessage });
    }
  },

  regenerateHypothesesGtm: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await regenerateHypothesesGtmMutation({ input });
      set({
        hypothesesGtm: removeTypename(data.regenerateHypothesesGtm),
        loading: false,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to regenerate GTM hypotheses";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  handleUpdateChannelField: async (
    stageKey: StageKeyType,
    channelId: string,
    field: keyof ChannelsType,
    value: any
  ) => {
    const { hypothesesGtm } = get();
    if (!hypothesesGtm) return;

    try {
      const stage = hypothesesGtm[stageKey];
      if (!stage) return;

      const updatedChannels = stage.channels.map((ch) =>
        String(ch.id) === String(channelId) ? { ...ch, [field]: value } : ch
      );

      const input = removeTypename({
        id: hypothesesGtm.id,
        [stageKey]: {
          name: stage.name,
          channels: updatedChannels,
        },
      });

      const { data } = await changeHypothesesGtmMutation({ input });

      if (data?.changeHypothesesGtm) {
        set({ hypothesesGtm: removeTypename(data.changeHypothesesGtm) });
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to update channel field";
      if (error instanceof Error) errorMessage = error.message;
      set({ error: errorMessage });
    }
  },
}));
