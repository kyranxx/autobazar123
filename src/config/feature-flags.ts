/**
 * Feature Flag Definitions
 * Default configuration for all feature flags
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers: string[];
}

type FeatureFlagKey =
  | "new_search_ui"
  | "dark_mode"
  | "premium_features"
  | "advanced_filters"
  | "ai_recommendations"
  | "social_sharing"
  | "view_transitions"
  | "vin_decoding";

export const DEFAULT_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  new_search_ui: {
    key: "new_search_ui",
    name: "New Search UI",
    description: "Enable the redesigned search interface",
    enabled: false,
    rolloutPercentage: 0,
    targetUsers: [],
  },
  dark_mode: {
    key: "dark_mode",
    name: "Dark Mode",
    description: "Enable dark mode theme support",
    enabled: false,
    rolloutPercentage: 0,
    targetUsers: [],
  },
  premium_features: {
    key: "premium_features",
    name: "Premium Features",
    description: "Enable premium features for selected users",
    enabled: false,
    rolloutPercentage: 0,
    targetUsers: [],
  },
  advanced_filters: {
    key: "advanced_filters",
    name: "Advanced Filters",
    description: "Enable advanced search filters",
    enabled: true,
    rolloutPercentage: 100,
    targetUsers: [],
  },
  ai_recommendations: {
    key: "ai_recommendations",
    name: "AI Recommendations",
    description: "Enable AI-powered car recommendations",
    enabled: false,
    rolloutPercentage: 0,
    targetUsers: [],
  },
  social_sharing: {
    key: "social_sharing",
    name: "Social Sharing",
    description: "Enable social media sharing features",
    enabled: true,
    rolloutPercentage: 100,
    targetUsers: [],
  },
  view_transitions: {
    key: "view_transitions",
    name: "View Transitions",
    description: "Enable small UI view transitions where supported",
    enabled: true,
    rolloutPercentage: 100,
    targetUsers: [],
  },
  vin_decoding: {
    key: "vin_decoding",
    name: "VIN Decoding",
    description: "Enable Vincario VIN decoding in listing forms",
    enabled: false,
    rolloutPercentage: 100,
    targetUsers: [],
  },
};
