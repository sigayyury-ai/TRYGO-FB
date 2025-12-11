import { useEffect } from 'react';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUserStore } from '@/store/useUserStore';
import { PlanType } from '../types/SubscriptionType';

export const useSubscription = () => {
  const {
    subscription,
    assistantMessages,
    currentPlan,
    isLoading,
    error,
    fetchSubscription,
    forceRefreshSubscription,
    fetchAssistantMessages,
    createCheckout,
    changeSubscription,
    getStripeSession,
    getCurrentPlan,
    canSendMessage,
    canCreateProject,
    canCreateHypothesis,
    hasFeatureAccess,
    isTrialExpired,
    isSubscriptionActive,
    reset
  } = useSubscriptionStore();

  const { userData } = useUserStore();

  // Fetch subscription data when user is available
  useEffect(() => {
    if (userData?.id) {
      // Only fetch if not already initialized to prevent infinite loops
      fetchSubscription();
      fetchAssistantMessages();
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id]); // Виконується тільки коли змінюється userData?.id

  // Check if trial is expired
  const isTrialExpiredForUser = () => {
    return isTrialExpired(userData?.freeTrialDueTo);
  };

  // Check if user needs to upgrade
  const needsUpgrade = () => {
    if (isTrialExpiredForUser() && !isSubscriptionActive()) {
      return true;
    }
    
    if (subscription && !isSubscriptionActive()) {
      return true;
    }
    
    return false;
  };

  // Get current plan with trial consideration
  const getEffectivePlan = (): PlanType => {
    if (isTrialExpiredForUser() && !isSubscriptionActive()) {
      return PlanType.FREE;
    }
    
    return getCurrentPlan();
  };

  // Create checkout session or change subscription
  const handleUpgrade = async (planType: 'STARTER' | 'PRO') => {
    try {
      // If user already has an active subscription, change it
      if (isSubscriptionActive()) {
        await changeSubscription(planType);
      } else {
        // If no active subscription, create checkout
        const checkoutUrl = await createCheckout(planType);
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      throw error;
    }
  };

  // Manage subscription
  const handleManageSubscription = async () => {
    try {
      const sessionUrl = await getStripeSession();
      window.open(sessionUrl, '_blank');
    } catch (error) {
      throw error;
    }
  };

  return {
    // State
    subscription,
    assistantMessages,
    currentPlan: getEffectivePlan(),
    isLoading,
    error,
    
    // Computed
    isTrialExpired: isTrialExpiredForUser(),
    needsUpgrade: needsUpgrade(),
    isSubscriptionActive: isSubscriptionActive(),
    
    // Actions
    canSendMessage,
    canCreateProject,
    canCreateHypothesis,
    hasFeatureAccess,
    handleUpgrade,
    handleManageSubscription,
    
    // Refresh data
    refreshSubscription: forceRefreshSubscription,
    refreshMessages: fetchAssistantMessages
  };
};

export default useSubscription;
