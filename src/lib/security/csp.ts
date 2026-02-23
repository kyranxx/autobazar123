export interface CspBuildOptions {
  isDev: boolean;
  enableGoogleOneTap: boolean;
  includeUpgradeInsecureRequests: boolean;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function joinSources(values: string[]): string {
  return unique(values).join(" ");
}

export function buildCspHeader({
  isDev,
  enableGoogleOneTap,
  includeUpgradeInsecureRequests,
}: CspBuildOptions): string {
  const scriptSrc = joinSources([
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://*.algolia.net",
    "https://*.algolianet.com",
    "https://js.stripe.com",
    "https://www.googletagmanager.com",
    "https://www.clarity.ms",
    "https://c.bing.com",
    ...(enableGoogleOneTap ? ["https://accounts.google.com"] : []),
  ]);

  const styleSrc = joinSources([
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
  ]);

  const imgSrc = joinSources([
    "'self'",
    "data:",
    "blob:",
    "https://imagedelivery.net",
    "https://images.unsplash.com",
    "https://plus.unsplash.com",
    "https://*.supabase.co",
    "https://tile.openstreetmap.org",
    "https://*.tile.openstreetmap.org",
    "https://www.clarity.ms",
    "https://c.bing.com",
  ]);

  const fontSrc = joinSources(["'self'", "data:", "https://fonts.gstatic.com"]);

  const connectSrc = joinSources([
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.algolia.net",
    "https://*.algolianet.com",
    "https://api.stripe.com",
    "https://*.upstash.io",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://www.clarity.ms",
    "https://c.bing.com",
    ...(enableGoogleOneTap ? ["https://accounts.google.com"] : []),
  ]);

  const frameSrc = joinSources([
    "'self'",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    ...(enableGoogleOneTap ? ["https://accounts.google.com"] : []),
  ]);

  const formAction = joinSources([
    "'self'",
    ...(enableGoogleOneTap ? ["https://accounts.google.com"] : []),
  ]);

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `font-src ${fontSrc}`,
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc}`,
    "frame-ancestors 'self'",
    `form-action ${formAction}`,
    "base-uri 'self'",
    "object-src 'none'",
    includeUpgradeInsecureRequests ? "upgrade-insecure-requests" : null,
  ].filter((value): value is string => Boolean(value));

  return directives.join("; ");
}
