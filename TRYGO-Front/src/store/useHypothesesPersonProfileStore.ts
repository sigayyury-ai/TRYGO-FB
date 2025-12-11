import { create } from "zustand";
import {
  HypothesesPersonProfileDto,
  getHypothesesPersonProfileQuery,
  changeHypothesesPersonProfileMutation,
  ChangeHypothesesPersonProfileInput,
} from "@/api/hypothesesPersonProfile";
import { getActiveCustomerSegmentId, setActiveCustomerSegmentId } from "@/utils/activeState";

interface HypothesesPersonProfileState {
  profile: HypothesesPersonProfileDto | null;
  allProfiles: HypothesesPersonProfileDto[] | null;
  loading: boolean;
  wasAutoRefreshed: boolean;
  error: string | null;
  setSelectedCustomerSegmentId: (selectedCustomerSegmentId: string | null) => void;
  getSelectedCustomerSegmentId: () => string | null;
  fetchProfile: (projectHypothesisId: string) => Promise<void>;
  updateProfile: (input: ChangeHypothesesPersonProfileInput) => Promise<void>;
}

export const useHypothesesPersonProfileStore =
  create<HypothesesPersonProfileState>()((set, get) => ({
        profile: null,
        allProfiles: null,
        loading: false,
        wasAutoRefreshed: false,
        error: null,

        getSelectedCustomerSegmentId: () => {
          return getActiveCustomerSegmentId();
        },

        setSelectedCustomerSegmentId: (selectedCustomerSegmentId) => {
          setActiveCustomerSegmentId(selectedCustomerSegmentId);
        },
        fetchProfile: async (projectHypothesisId: string) => {
          set({ loading: true, error: null });
          try {
            // Сбрасываем selectedSegmentId при смене гипотезы, чтобы загрузить данные для новой гипотезы
            setActiveCustomerSegmentId(null);
            set({ profile: null, allProfiles: null });

            const { data } = await getHypothesesPersonProfileQuery(
              projectHypothesisId
            );
            const profiles = data.getAllHypothesesPersonProfiles || [];

            // Читаем selectedSegmentId из куки (мог восстановиться из предыдущей гипотезы)
            const selectedSegmentId = getActiveCustomerSegmentId();

            // Проверяем, существует ли выбранный сегмент в загруженных профилях
            // Если selectedSegmentId не найден среди профилей новой гипотезы, сбрасываем его
            let validSelectedSegmentId = selectedSegmentId;
            if (selectedSegmentId && profiles.length > 0) {
              const segmentExists = profiles.some(
                (profile) => profile.customerSegmentId === selectedSegmentId
              );
              if (!segmentExists) {
                validSelectedSegmentId = null;
              }
            } else {
              validSelectedSegmentId = null;
            }

            // Ищем профиль по validSelectedSegmentId, если он указан
            let matchedProfile = null;
            if (validSelectedSegmentId && profiles.length > 0) {
              matchedProfile = profiles.find(
                (profile) => profile.customerSegmentId === validSelectedSegmentId
              ) || null;
            }
            
            // Если не нашли по validSelectedSegmentId или его нет, берем первый профиль
            if (!matchedProfile && profiles.length > 0) {
              matchedProfile = profiles[0];
              // Автоматически устанавливаем selectedSegmentId для первого профиля в куки
              if (matchedProfile.customerSegmentId) {
                validSelectedSegmentId = matchedProfile.customerSegmentId;
                setActiveCustomerSegmentId(validSelectedSegmentId);
              }
            } else if (validSelectedSegmentId) {
              // Сохраняем валидный selectedSegmentId в куки
              setActiveCustomerSegmentId(validSelectedSegmentId);
            }

            set({
              profile: matchedProfile,
              allProfiles: profiles,
              loading: false,
            });
          } catch (error: unknown) {
            let errorMessage = "Failed to fetch ICP profile";
            if (error instanceof Error) {
              errorMessage = error.message;
            }
            setActiveCustomerSegmentId(null);
            set({
              error: errorMessage,
              profile: null,
              allProfiles: null,
              loading: false,
            });
          }
        },

        updateProfile: async (input: ChangeHypothesesPersonProfileInput) => {
          set({ loading: true, error: null });
          try {
            const { data } = await changeHypothesesPersonProfileMutation(input);
            const updatedProfile = data?.changeHypothesesPersonProfile || null;

            if (!updatedProfile) {
              throw new Error("Profile update returned null");
            }

            set((state) => ({
              profile: state.profile?.id === updatedProfile.id 
                ? updatedProfile 
                : state.profile,
              allProfiles: state.allProfiles
                ? state.allProfiles.map((profile) =>
                    profile.id === updatedProfile.id ? updatedProfile : profile
                  )
                : null,
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
            throw error; // Пробрасываем ошибку дальше для обработки в компоненте
          }
        },
      })
  );
