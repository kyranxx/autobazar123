export type RuntimeEnvProfile =
  | "app"
  | "proxy"
  | "authEmail"
  | "emailDelivery"
  | "stripeCheckout"
  | "stripeWebhook"
  | "cloudflareImages"
  | "algoliaSync";

type RuntimeEnvRequirement = {
  name: string;
  when?: (env: NodeJS.ProcessEnv) => boolean;
};

function normalizeEnvValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/^(?:\\r\\n|\\r|\\n)+|(?:\\r\\n|\\r|\\n)+$/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+$/g, "")
    .trim();

  return normalized.length > 0 ? normalized : null;
}

const requireInProduction = (env: NodeJS.ProcessEnv): boolean =>
  env.NODE_ENV === "production";

const RUNTIME_ENV_REQUIREMENTS: Record<
  RuntimeEnvProfile,
  RuntimeEnvRequirement[]
> = {
  app: [
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" },
    { name: "NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE", when: requireInProduction },
  ],
  proxy: [
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" },
    { name: "NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE", when: requireInProduction },
    { name: "UPSTASH_REDIS_REST_URL", when: requireInProduction },
    { name: "UPSTASH_REDIS_REST_TOKEN", when: requireInProduction },
  ],
  authEmail: [
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "SUPABASE_SERVICE_ROLE_KEY" },
    { name: "RESEND_API_KEY" },
    { name: "EMAIL_FROM" },
    { name: "EMAIL_REPLY_TO" },
  ],
  emailDelivery: [
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "SUPABASE_SERVICE_ROLE_KEY" },
    { name: "RESEND_API_KEY" },
    { name: "EMAIL_FROM" },
    { name: "EMAIL_REPLY_TO" },
  ],
  stripeCheckout: [
    { name: "STRIPE_SECRET_KEY" },
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "SUPABASE_SERVICE_ROLE_KEY" },
    { name: "NEXT_PUBLIC_APP_URL" },
    { name: "NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE" },
  ],
  stripeWebhook: [
    { name: "STRIPE_SECRET_KEY" },
    { name: "STRIPE_WEBHOOK_SECRET" },
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "SUPABASE_SERVICE_ROLE_KEY" },
    { name: "NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE" },
  ],
  cloudflareImages: [
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" },
    { name: "CLOUDFLARE_ACCOUNT_ID" },
    { name: "CLOUDFLARE_API_TOKEN" },
  ],
  algoliaSync: [
    { name: "NEXT_PUBLIC_SUPABASE_URL" },
    { name: "SUPABASE_SERVICE_ROLE_KEY" },
    { name: "NEXT_PUBLIC_ALGOLIA_APP_ID" },
    { name: "ALGOLIA_ADMIN_KEY" },
    { name: "ALGOLIA_SYNC_SECRET" },
    { name: "NEXT_PUBLIC_ALGOLIA_ADS_INDEX" },
  ],
};

const validatedRuntimeProfiles = new Set<RuntimeEnvProfile>();

export function getTrimmedEnv(name: string): string | null {
  return normalizeEnvValue(process.env[name]);
}

export function hasTrimmedEnv(name: string): boolean {
  return getTrimmedEnv(name) !== null;
}

export function getMissingRuntimeEnvVars(
  profile: RuntimeEnvProfile,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  return RUNTIME_ENV_REQUIREMENTS[profile]
    .filter((requirement) => {
      if (requirement.when && !requirement.when(env)) {
        return false;
      }

      return normalizeEnvValue(env[requirement.name]) === null;
    })
    .map((requirement) => requirement.name);
}

export function getRuntimeEnvConfigurationError(
  profile: RuntimeEnvProfile,
  env: NodeJS.ProcessEnv = process.env,
): Error | null {
  if (env.NODE_ENV === "test") {
    return null;
  }

  const missing = getMissingRuntimeEnvVars(profile, env);
  if (missing.length === 0) {
    return null;
  }

  return new Error(
    `Missing required runtime env vars for ${profile}: ${missing.join(", ")}`,
  );
}

export function assertRuntimeEnvConfigured(
  profile: RuntimeEnvProfile,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (validatedRuntimeProfiles.has(profile)) {
    return;
  }

  const error = getRuntimeEnvConfigurationError(profile, env);
  if (!error) {
    validatedRuntimeProfiles.add(profile);
    return;
  }

  console.error(error.message);
  throw error;
}
