import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Subscription, 
  AssistantMessages, 
  PlanType, 
  SubscriptionStatus,
  PLAN_LIMITS, 
  SubscriptionType
} from '../types/SubscriptionType';
import { getSubscription } from '../api/getSubscription';
import { getAssistantMessages } from '../api/getAssistantMessages';
import { createSubscriptionCheckout } from '../api/createSubscriptionCheckout';
import { getSubscriptionStripeSession } from '../api/getSubscriptionStripeSession';
import { changeSubscription } from '../api/changeSubscription';
import { useUserStore } from './useUserStore';

interface SubscriptionState {
  subscription: Subscription | null;
  assistantMessages: AssistantMessages | null;
  currentPlan: PlanType;
  isLoading: boolean;
  isFetchingSubscription: boolean;
  hasInitializedSubscription: boolean;
  isFetchingMessages: boolean;
  hasInitializedMessages: boolean;
  error: string | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  forceRefreshSubscription: () => Promise<void>;
  fetchAssistantMessages: () => Promise<void>;
  createCheckout: (type: 'STARTER' | 'PRO') => Promise<string>;
  changeSubscription: (type: 'STARTER' | 'PRO') => Promise<boolean>;
  getStripeSession: () => Promise<string>;
  getCurrentPlan: () => PlanType;
  canSendMessage: () => boolean;
  canCreateProject: (currentProjectsCount: number) => boolean;
  canCreateHypothesis: (currentHypothesesCount: number) => boolean;
  hasFeatureAccess: (feature: 'icp' | 'validation' | 'gtm-channel' | 'research' | 'packing') => boolean;
  isTrialExpired: (freeTrialDueTo?: string) => boolean;
  isSubscriptionActive: () => boolean;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    (set, get) => ({
      subscription: null,
      assistantMessages: null,
      currentPlan: PlanType.FREE,
      isLoading: true,
      isFetchingSubscription: false,
      hasInitializedSubscription: false,
      isFetchingMessages: false,
      hasInitializedMessages: false,
      error: null,

      fetchSubscription: async () => {
        const { isFetchingSubscription, hasInitializedSubscription } = get();
        // Prevent multiple simultaneous requests and skip if already initialized
        if (isFetchingSubscription || hasInitializedSubscription) {
          return;
        }
        
        set({ isFetchingSubscription: true, isLoading: true, error: null });
        try {
          const subscription = await getSubscription();
          // getSubscription returns null on error, so we always initialize
          set({ 
            subscription, 
            isFetchingSubscription: false, 
            isLoading: false,
            hasInitializedSubscription: true 
          });
        } catch (error) {
          // Always set hasInitializedSubscription to prevent infinite retries
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch subscription',
            isFetchingSubscription: false,
            isLoading: false,
            hasInitializedSubscription: true // Ensure we don't retry on error
          });
        }
      },

      forceRefreshSubscription: async () => {
        const { isFetchingSubscription } = get();
        if (isFetchingSubscription) return;
        
        set({ isFetchingSubscription: true, isLoading: true, error: null, hasInitializedSubscription: false });
        try {
          const subscription = await getSubscription();
          set({ 
            subscription, 
            isFetchingSubscription: false, 
            isLoading: false,
            hasInitializedSubscription: true 
          });
        } catch (error) {
          console.error('[forceRefreshSubscription] Critical error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch subscription',
            isFetchingSubscription: false,
            isLoading: false,
            hasInitializedSubscription: true
          });
        }
      },

      fetchAssistantMessages: async () => {
        const { isFetchingMessages, hasInitializedMessages } = get();
        // Prevent multiple simultaneous requests and skip if already initialized
        if (isFetchingMessages || hasInitializedMessages) {
          return;
        }
        
        set({ isFetchingMessages: true, isLoading: true, error: null });
        try {
          const assistantMessages = await getAssistantMessages();
          set({ 
            assistantMessages, 
            isFetchingMessages: false, 
            isLoading: false,
            hasInitializedMessages: true 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch assistant messages',
            isFetchingMessages: false,
            isLoading: false,
            hasInitializedMessages: true
          });
        }
      },

      createCheckout: async (type: 'STARTER' | 'PRO') => {
        try {
          const subscriptionType = type === 'STARTER' ? SubscriptionType.STARTER : SubscriptionType.PRO;
          return await createSubscriptionCheckout(subscriptionType);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create checkout'
          });
          throw error;
        }
      },

      changeSubscription: async (type: 'STARTER' | 'PRO') => {
        set({ isLoading: true, error: null });
        try {
          const subscriptionType = type === 'STARTER' ? SubscriptionType.STARTER : SubscriptionType.PRO;
          const result = await changeSubscription(subscriptionType);
          // Refresh subscription data after successful change
          await get().forceRefreshSubscription();
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to change subscription',
            isLoading: false 
          });
          throw error;
        }
      },

      getStripeSession: async () => {
        try {
          return await getSubscriptionStripeSession();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get stripe session'
          });
          throw error;
        }
      },

      getCurrentPlan: () => {
        const { subscription } = get();
        if (!subscription) return PlanType.FREE;
        
        const isActive = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(
          subscription.status as SubscriptionStatus
        );
        
        if (!isActive) return PlanType.FREE;
        
        return subscription.type === 'STARTER' ? PlanType.STARTER : PlanType.PRO;
      },

      canSendMessage: () => {
        // Check if user is admin - admins have unlimited messages
        const userData = useUserStore.getState().userData;
        if (userData?.role === 'ADMIN') {
          return true;
        }
        
        const { assistantMessages } = get();
        const currentPlan = get().getCurrentPlan();
        const limits = PLAN_LIMITS[currentPlan];
        
        if (!assistantMessages) return true; // Allow if we can't fetch data
        
        return assistantMessages.generatedMessages < limits.maxMessages;
      },

      canCreateProject: (currentProjectsCount: number) => {
        // Check if user is admin - admins have unlimited projects
        const userData = useUserStore.getState().userData;
        if (userData?.role === 'ADMIN') {
          return true;
        }
        
        const currentPlan = get().getCurrentPlan();
        const limits = PLAN_LIMITS[currentPlan];
        
        return currentProjectsCount < limits.maxProjects;
      },

      canCreateHypothesis: (currentHypothesesCount: number) => {
        // Check if user is admin - admins have unlimited hypotheses
        const userData = useUserStore.getState().userData;
        if (userData?.role === 'ADMIN') {
          return true;
        }
        
        const currentPlan = get().getCurrentPlan();
        const limits = PLAN_LIMITS[currentPlan];
        
        return currentHypothesesCount < limits.maxHypotheses;
      },

      hasFeatureAccess: (feature: 'icp' | 'validation' | 'gtm-channel' | 'research' | 'packing') => {
        // Check if user is admin - admins have access to all features
        const userData = useUserStore.getState().userData;
        if (userData?.role === 'ADMIN') {
          return true;
        }
        
        const currentPlan = get().getCurrentPlan();
        const limits = PLAN_LIMITS[currentPlan];
        
        switch (feature) {
          case 'icp':
            return limits.hasIcpFullAccess;
          case 'validation':
            return limits.hasValidationAnalysis;
          case 'gtm-channel':
            return limits.hasGtmChannelAccess;
          case 'research':
            return limits.hasResearchAccess;
          case 'packing':
            return limits.hasPackingAccess;
          default:
            return false;
        }
      },

      isTrialExpired: (freeTrialDueTo?: string) => {
        if (!freeTrialDueTo) return false;
        
        const trialEndDate = new Date(freeTrialDueTo);
        const now = new Date();
        
        return now > trialEndDate;
      },

      isSubscriptionActive: () => {
        const { subscription } = get();
        if (!subscription) return false;
        
        return [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(
          subscription.status as SubscriptionStatus
        );
      },

      reset: () => {
        set({
          subscription: null,
          assistantMessages: null,
          currentPlan: PlanType.FREE,
          isLoading: false,
          isFetchingSubscription: false,
          hasInitializedSubscription: false,
          isFetchingMessages: false,
          hasInitializedMessages: false,
          error: null
        });
      }
    }),
    {
      name: 'subscription-store'
    }
  )
);
