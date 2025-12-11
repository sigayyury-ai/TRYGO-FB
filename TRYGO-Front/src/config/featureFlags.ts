/**
 * Feature Flags Configuration for SEO Agent
 * 
 * These flags control access and behavior of the SEO Agent feature.
 * In production, these should be managed via LaunchDarkly/ConfigCat.
 * For now, using environment variables and defaults.
 */

export interface FeatureFlags {
  seoAgent: {
    enabled: boolean;
    devShell: boolean;
    uiTesting: boolean;
  };
}

/**
 * Get feature flags from environment variables with sensible defaults
 */
export const getFeatureFlags = (): FeatureFlags => {
  const env = import.meta.env;
  
  // В Vite import.meta.env.DEV - это булево значение
  // Проверяем dev режим несколькими способами для надежности
  const isDev = env.DEV === true || 
                env.MODE === 'development' || 
                env.PROD === false ||
                !env.PROD;

  // По умолчанию включаем SEO Agent в dev режиме
  const seoAgentEnabled = env.VITE_SEO_AGENT_ENABLED === "true" || 
                         (env.VITE_SEO_AGENT_ENABLED !== "false" && isDev);

  return {
    seoAgent: {
      enabled: seoAgentEnabled,
      devShell: env.VITE_SEO_AGENT_DEV_SHELL === "true",
      uiTesting: env.VITE_SEO_AGENT_UI_TESTING === "true" || isDev,
    },
  };
};

/**
 * Hook to check if SEO Agent is enabled
 */
export const useSeoAgentEnabled = (): boolean => {
  return getFeatureFlags().seoAgent.enabled;
};

/**
 * Hook to check if dev shell mode is enabled
 */
export const useSeoAgentDevShell = (): boolean => {
  return getFeatureFlags().seoAgent.devShell;
};

/**
 * Hook to check if UI testing mode is enabled
 */
export const useSeoAgentUiTesting = (): boolean => {
  return getFeatureFlags().seoAgent.uiTesting;
};

export const featureFlags = getFeatureFlags();


