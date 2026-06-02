import type { PostHogInterface } from "posthog-js";

type PostHogModuleClient = typeof import("posthog-js").default;

let posthogModuleClient: PostHogModuleClient | null = null;
let loadedPostHog: PostHogInterface | null = null;
let loadingPostHog: Promise<PostHogModuleClient> | null = null;

async function loadPostHog() {
  if (posthogModuleClient) {
    return posthogModuleClient;
  }

  loadingPostHog =
    loadingPostHog ||
    import("posthog-js").then((module) => {
      posthogModuleClient = module.default;
      loadedPostHog = module.default;
      return module.default;
    });

  return loadingPostHog;
}

export function isPostHogLoaded() {
  return Boolean(loadedPostHog?.__loaded);
}

export async function initPostHogClient(
  apiKey: string,
  host: string,
  userId: string | null,
) {
  const posthog = await loadPostHog();

  if (posthog.__loaded) {
    posthog.opt_in_capturing();
    if (userId) {
      posthog.identify(userId);
    }
    return;
  }

  posthog.init(apiKey, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    persistence: "localStorage+cookie",
    person_profiles: "identified_only",
    secure_cookie: true,
    loaded(instance: PostHogInterface) {
      loadedPostHog = instance;
      instance.opt_in_capturing();
      if (userId) {
        instance.identify(userId);
      }
    },
  });
}

export function optOutPostHogClient() {
  if (loadedPostHog?.__loaded) {
    loadedPostHog.opt_out_capturing();
  }
}

export function capturePostHogEvent(name: string, payload: Record<string, unknown>) {
  if (loadedPostHog?.__loaded) {
    loadedPostHog.capture(name, payload);
  }
}

export function identifyPostHogUser(userId: string | null) {
  if (!loadedPostHog?.__loaded) {
    return;
  }

  if (userId) {
    loadedPostHog.identify(userId);
    return;
  }

  loadedPostHog.reset();
}
