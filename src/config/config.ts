export const APP_URLS = {
  siteOrigin: "https://autobazar123.sk",
  localhostOrigin: "http://localhost:3000",
  localhostLoopbackOrigin: "http://127.0.0.1:3000",
  googleAccountsScript: "https://accounts.google.com/gsi/client",
  resendApi: "https://api.resend.com/emails",
  schemaOrg: "https://schema.org",
  turnstileScript: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
  turnstileVerify: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
} as const;

export const SEARCH_RESULTS_CONFIG = {
  minSuggestionLength: 2,
  refineDebounceMs: 90,
  remoteSuggestionDebounceMs: 120,
  typingIdleMs: 160,
  brandModelSuggestionLimit: 5,
  remoteSuggestionLimit: 8,
  frequentSearchThreshold: 6,
  interactionStorageKey: "ab123_search_interactions",
  topAdOptionalFilter: "is_top_ad:true<score=10>",
} as const;

export const AUTH_MODAL_CONFIG = {
  resendCooldownSeconds: 60,
  resendCooldownTickMs: 1_000,
  coarsePointerMediaQuery: "(pointer: coarse)",
  noHoverMediaQuery: "(hover: none)",
} as const;

export const BRAND_VISUAL_CONFIG = {
  authPanelGradientEnd: "#003D22",
  authPanelFeatureGlow: "rgba(120, 240, 176, 0.18)",
  googleBrandColors: {
    blue: "#4285F4",
    green: "#34A853",
    yellow: "#FBBC05",
    red: "#EA4335",
  },
} as const;

export const SEO_CONFIG = {
  sitemapListingLimit: 5_000,
} as const;
