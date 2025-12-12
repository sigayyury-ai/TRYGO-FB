import Cookies from "js-cookie";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { getUserByTokenQuery } from "@/api/getUserByToken";

export interface UserDataType {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  freeTrialDueTo?: string;
  isProjectGenerated?: boolean;
}

interface UseUserStoreType {
  userData: UserDataType | null;
  isAuthenticated: boolean;
  hasInitializedProject: boolean;
  setHasInitializedProject: (value: boolean) => void;
  token: string | null;
  isLoading: boolean;
  showJoyride: boolean;
  setShowJoyride: (value: boolean) => void;
  setUserData: (user?: UserDataType | null, token?: string | null) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useUserStore = create<UseUserStoreType>()(
  persist(
    devtools(
      (set, get) => ({
        userData: null,
        isAuthenticated: false,
        hasInitializedProject: false,
        setHasInitializedProject: (value) =>
          set({ hasInitializedProject: value }),
        // Токен всегда проверяем из cookies при инициализации
        // persist может восстановить null, но мы всегда можем проверить cookies
        token: Cookies.get("token") || null,
        isLoading: false,
        showJoyride: false,
        setShowJoyride: (value) => set({ showJoyride: value }),
        setUserData: (user, token) => {
          set({
            userData: user ?? null,
            isAuthenticated: !!user,
            token: token ?? null,
            // Синхронизируем hasInitializedProject с isProjectGenerated из БД
            hasInitializedProject: user?.isProjectGenerated ?? false,
          });
          if (token) {
            Cookies.set("token", token, {
              expires: 30,
              secure: true,
              sameSite: "strict",
            });
          } else {
            Cookies.remove("token");
          }
          // Сохраняем userId в cookies для использования в API запросах
          if (user?.id) {
            Cookies.set("userId", user.id, {
              expires: 30,
              secure: true,
              sameSite: "strict",
            });
            localStorage.setItem("userId", user.id);
          } else {
            Cookies.remove("userId");
            localStorage.removeItem("userId");
          }
        },
        logout: () => {
          Cookies.remove("token");
          Cookies.remove("userId");
          localStorage.removeItem("userId");
          // Очищаем persist storage для useUserStore
          localStorage.removeItem("useUserStore");
          set({ userData: null, isAuthenticated: false, token: null, showJoyride: false });
        },
  
        initializeAuth: async () => {
          set({ isLoading: true });
          // Проверяем токен и из store, и из cookies (на случай если persist еще не загрузился)
          const storeToken = get().token;
          const cookieToken = Cookies.get("token");
          const currentToken = storeToken || cookieToken;
          const currentUserData = get().userData;
  
          // Если токен есть в cookies, но не в store - восстанавливаем его
          if (cookieToken && !storeToken) {
            set({ token: cookieToken });
          }
  
          try {
            if (currentToken) {
              // Если есть токен, всегда проверяем его валидность через API
              const { user, token } = await getUserByTokenQuery();
              // Синхронизируем hasInitializedProject с isProjectGenerated из БД
              set({ 
                userData: user, 
                isAuthenticated: true, 
                token,
                hasInitializedProject: user?.isProjectGenerated ?? false
              });
            } else if (currentUserData) {
              // Если токена нет, но userData есть - очищаем (невалидное состояние)
              set({ userData: null, isAuthenticated: false });
            }
          } catch (error: unknown) {
            // Only logout on authentication errors (401, 403), not on network errors
            const isAuthError = error && typeof error === 'object' && (
              ('networkError' in error && (error as any).networkError?.statusCode === 401) ||
              ('graphQLErrors' in error && (error as any).graphQLErrors?.some((e: any) => e?.extensions?.code === 'UNAUTHENTICATED')) ||
              (error instanceof Error && (error.message.includes('401') || error.message.includes('UNAUTHENTICATED')))
            );
            
            // If it's a network error (connection refused, etc.), keep the token and don't logout
            const isNetworkError = error && typeof error === 'object' && (
              ('networkError' in error && (error as any).networkError?.message?.includes('CONNECTION_REFUSED')) ||
              (error instanceof Error && error.message.includes('CONNECTION_REFUSED'))
            );
            
            if (isAuthError) {
              // Token is invalid, logout
              get().logout();
              window.location.href = '/auth';
            } else if (!isNetworkError) {
              // Other errors - keep token but don't set user as authenticated
              console.warn('Auth initialization error (non-auth):', error);
              // Если есть userData в localStorage - сохраняем его, возможно это временная ошибка
              if (currentUserData && currentToken) {
                // Сохраняем состояние из localStorage, если токен есть
                set({ userData: currentUserData, isAuthenticated: true });
              } else {
                set({ userData: null, isAuthenticated: false });
              }
            } else {
              // Network error - keep everything, backend might be starting
              console.warn('Backend connection error, keeping auth state:', error);
              // При сетевой ошибке сохраняем состояние из localStorage, если оно есть
              if (currentUserData && currentToken) {
                set({ userData: currentUserData, isAuthenticated: true });
              }
            }
          } finally {
            set({ isLoading: false });
          }
        },
      }),
      { name: "useUserStore" }
    ),
    {
      name: "useUserStore",
      partialize: (state) => ({
        userData: state.userData,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        hasInitializedProject: state.hasInitializedProject,
        showJoyride: state.showJoyride,
      }),
      // После восстановления состояния из localStorage проверяем cookies
      // Если токен есть в cookies, но не в store - восстанавливаем его
      onRehydrateStorage: () => (state) => {
        if (state) {
          const cookieToken = Cookies.get("token");
          // Если токен есть в cookies, но не в восстановленном состоянии - восстанавливаем
          if (cookieToken && !state.token) {
            state.token = cookieToken;
          }
          // Если токен есть в cookies и отличается от восстановленного - обновляем
          if (cookieToken && cookieToken !== state.token) {
            state.token = cookieToken;
          }
        }
      },
    }
  )
);

export const setUserData = (
  user?: UserDataType | null,
  token?: string | null
) => {
  useUserStore.getState().setUserData(user, token);
};

export const setUserToken = (token?: string | null) => {
  if (token) {
    Cookies.set("token", token, {
      expires: 30,
      secure: true,
      sameSite: "strict",
    });
    useUserStore.setState({ token });
  } else {
    Cookies.remove("token");
    useUserStore.setState({ token: null });
  }
};
