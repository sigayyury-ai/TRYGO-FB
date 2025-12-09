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

  return {
    seoAgent: {
      enabled: env.VITE_SEO_AGENT_ENABLED === "true" || env.DEV === true,
      devShell: env.VITE_SEO_AGENT_DEV_SHELL === "true",
      uiTesting: env.VITE_SEO_AGENT_UI_TESTING === "true" || env.DEV === true,
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

