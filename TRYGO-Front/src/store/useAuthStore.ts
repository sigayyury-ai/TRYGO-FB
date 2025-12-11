import type { Dispatch, SetStateAction } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Alert } from './useAlertStore';
import { loginMutation, type LoginInputType } from '@/api/login';
import { registerMutation, type RegisterInputType } from '@/api/register';
import {
  forgotPasswordMutation,
  type ForgotPasswordInputType,
} from '@/api/forgotPassword';
import {
  changePasswordMutation,
  type ChangePasswordInputType,
} from '@/api/changePassword';
import { 
  authThrowThirdPartyMutation, 
  type AuthThrowThirdPartyInputType 
} from '@/api/authThrowThirdParty';
import { setUserData, setUserToken } from './useUserStore';

export interface UseAuthStoreType {
  isLoading: boolean;
  register: (
    variables: RegisterInputType,
    t: (text: string) => string
  ) => Promise<void>;
  login: (
    variables: LoginInputType,
    t: (text: string) => string
  ) => Promise<void>;
  loginWithGoogle: (googleIdToken: string) => Promise<void>;
  forgotPassword: (variables: ForgotPasswordInputType) => Promise<void>;
  changePassword: (variables: ChangePasswordInputType) => Promise<void>;
}

export const useAuthStore = create<UseAuthStoreType>()(
  devtools(
    (set) => ({
      isLoading: false,
      register: async (variables) => {
        set({ isLoading: true });
        try {
          const { data } = await registerMutation(variables);
          if (data) {
            setUserData(data.register.user);
            setUserToken(data.register.token);
            
            // Встановлюємо флаг для показу JoyRide новим користувачам
            const { useUserStore } = await import('./useUserStore');
            useUserStore.getState().setShowJoyride(true);
            
            // Projects will be loaded by App.tsx after authentication
            // Don't load here to avoid duplicate requests
          }
        } catch (err) {
          Alert(
            'error',
            err.message || 'Registration failed. Please try again.'
          );
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (variables) => {
        set({ isLoading: true });
        try {
          const { data } = await loginMutation(variables);
          if (data) {
            setUserData(data.login.user);
            setUserToken(data.login.token);
            
            // Projects will be loaded by App.tsx after authentication
            // Don't load here to avoid duplicate requests
          }
        } catch (err) {
          Alert(
            'error',
            err.message ||
              'Login failed. Please check your credentials and try again.'
          );

          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithGoogle: async (googleIdToken: string) => {
        set({ isLoading: true });
        try {
          const { data } = await authThrowThirdPartyMutation({
            input: { googleIdToken }
          });
          
          if (data) {
            setUserData(data.authThrowThirdParty.user);
            setUserToken(data.authThrowThirdParty.token);
            
            // Projects will be loaded by App.tsx after authentication
            // Don't load here to avoid duplicate requests
          }
        } catch (err) {
          Alert(
            'error',
            err.message || 'Google login failed. Please try again.'
          );
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (variables) => {
        set({ isLoading: true });
        try {
          const { data } = await forgotPasswordMutation(variables);
          if (data?.forgotPassword) {
            Alert(
              'success',
              "Check your email! We've sent you a password reset code."
            );
          }
        } catch (err) {
          Alert(
            'error',
            err.message || 'Password reset failed. Please try again later.'
          );

          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      changePassword: async (variables) => {
        set({ isLoading: true });
        try {
          const { data } = await changePasswordMutation(variables);
          if (data?.changePassword) {
            setUserData(data.changePassword.user);
            setUserToken(data.changePassword.token);

            Alert('success', 'Password changed successfully!');
          }
        } catch (err) {
          Alert(
            'error',
            err.message || 'Password change failed. Please try again.'
          );
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: 'useAuthStore' }
  )
);
