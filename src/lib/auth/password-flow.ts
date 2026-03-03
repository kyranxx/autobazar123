type AuthProviderLike = {
  provider?: unknown;
};

type AuthAppMetadataLike = {
  provider?: unknown;
  providers?: unknown;
};

type PasswordFlowUserLike = {
  app_metadata?: AuthAppMetadataLike | null;
  identities?: AuthProviderLike[] | null;
};

function normalizeProviderName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function collectUserProviders(user: PasswordFlowUserLike | null | undefined): string[] {
  const providers = new Set<string>();

  const primaryProvider = normalizeProviderName(user?.app_metadata?.provider);
  if (primaryProvider) {
    providers.add(primaryProvider);
  }

  const appProviders = user?.app_metadata?.providers;
  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      const normalized = normalizeProviderName(provider);
      if (normalized) {
        providers.add(normalized);
      }
    }
  }

  const identities = user?.identities;
  if (Array.isArray(identities)) {
    for (const identity of identities) {
      const normalized = normalizeProviderName(identity?.provider);
      if (normalized) {
        providers.add(normalized);
      }
    }
  }

  return [...providers];
}

export function shouldUseDirectPasswordSet(
  user: PasswordFlowUserLike | null | undefined,
): boolean {
  const providers = collectUserProviders(user);
  if (providers.length === 0) {
    return false;
  }

  return providers.some((provider) => provider !== "email");
}
