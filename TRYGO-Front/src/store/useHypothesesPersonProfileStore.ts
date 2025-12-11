import { create } from "zustand";
import {
  HypothesesPersonProfileDto,
  getHypothesesPersonProfileQuery,
  changeHypothesesPersonProfileMutation,
  ChangeHypothesesPersonProfileInput,
} from "@/api/hypothesesPersonProfile";
import { persist } from "zustand/middleware";

interface HypothesesPersonProfileState {
  profile: HypothesesPersonProfileDto | null;
  allProfiles: HypothesesPersonProfileDto[] | null;
  loading: boolean;
  wasAutoRefreshed: boolean;
  error: string | null;
  selectedCustomerSegmentId: string | undefined;
  setSelectedCustomerSegmentId: (selectedCustomerSegmentId: string) => void;
  fetchProfile: (projectHypothesisId: string) => Promise<void>;
  updateProfile: (input: ChangeHypothesesPersonProfileInput) => Promise<void>;
}

export const useHypothesesPersonProfileStore =
  create<HypothesesPersonProfileState>()(
    persist(
      (set, get) => ({
        profile: null,
        allProfiles: null,
        loading: false,
        wasAutoRefreshed: false,
        error: null,
        selectedCustomerSegmentId: undefined,

        setSelectedCustomerSegmentId: (selectedCustomerSegmentId) => {
          set({ selectedCustomerSegmentId });
        },
        fetchProfile: async (projectHypothesisId: string) => {
          set({ loading: true, error: null });
          try {
            const { data } = await getHypothesesPersonProfileQuery(
              projectHypothesisId
            );
            const profiles = data.getAllHypothesesPersonProfiles || [];

            const selectedSegmentId = get().selectedCustomerSegmentId;

            const matchedProfile = selectedSegmentId
              ? profiles.find((profile) => profile.customerSegmentId === selectedSegmentId)
              : profiles[0] || null;


            set({
              profile: matchedProfile || null,
              allProfiles: profiles,
              loading: false,
            });
          } catch (error: unknown) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch profile",
              loading: false,
            });
          }
        },

        updateProfile: async (input: ChangeHypothesesPersonProfileInput) => {
          try {
            const { data } = await changeHypothesesPersonProfileMutation(input);
            const updatedProfile = data?.changeHypothesesPersonProfile || null;

            if (!updatedProfile) {
              throw new Error("Profile update returned null");
            }


            set((state) => ({
              profile: {
                ...state.profile,
                ...updatedProfile, 
              },
              // allProfiles: state.allProfiles
              //   ? state.allProfiles.map((profile) =>
              //       profile.id === updatedProfile.id ? updatedProfile : profile
              //     )
              //   : null,
              loading: false,
            }));
          } catch (error: unknown) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to update profile",
              loading: false,
            });
          }
        },
      }),
      {
        name: "person-profile-store",
        partialize: (state) => ({
          selectedCustomerSegmentId: state.selectedCustomerSegmentId,
        }),
      }
    )
  );
