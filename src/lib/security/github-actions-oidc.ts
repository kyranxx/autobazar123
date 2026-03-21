import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const GITHUB_ACTIONS_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_ACTIONS_OIDC_JWKS = createRemoteJWKSet(
  new URL(`${GITHUB_ACTIONS_OIDC_ISSUER}/.well-known/jwks`),
);
const DEFAULT_QUALITY_GATE_OIDC_AUDIENCE = "autobazar123-quality-gates";

function normalizeRepositorySlug(value: string): string {
  return value.trim().toLowerCase();
}

function parseAllowedRepositories(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => normalizeRepositorySlug(entry))
    .filter((entry) => entry.length > 0);
}

function getStringClaim(payload: JWTPayload, key: string): string | null {
  const value = payload[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getAcceptedAudiences(env = process.env): string[] {
  const configuredAudience = env.QUALITY_GATE_ALERT_OIDC_AUDIENCE?.trim();
  const audiences = [
    configuredAudience,
    DEFAULT_QUALITY_GATE_OIDC_AUDIENCE,
  ].filter((value): value is string => Boolean(value && value.length > 0));

  return [...new Set(audiences)];
}

function assertAllowedRepository(
  repository: string | null,
  allowedRepositories: string[],
): string {
  if (!repository) {
    throw new Error("GitHub OIDC token missing repository claim.");
  }

  if (allowedRepositories.length === 0) {
    throw new Error("QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES is not configured.");
  }

  const normalizedRepository = normalizeRepositorySlug(repository);
  if (!allowedRepositories.includes(normalizedRepository)) {
    throw new Error(`GitHub OIDC repository is not allowed: ${repository}`);
  }

  return normalizedRepository;
}

function assertWorkflowRefMatchesRepository(
  workflowRef: string | null,
  repository: string,
): void {
  if (!workflowRef) {
    return;
  }

  const normalizedWorkflowRef = workflowRef.toLowerCase();
  if (!normalizedWorkflowRef.startsWith(`${repository}/.github/workflows/`)) {
    throw new Error("GitHub OIDC workflow reference does not match repository claim.");
  }
}

type GitHubActionsOidcVerification = {
  normalizedRepository: string;
  payload: JWTPayload;
  workflowRef: string | null;
};

export async function verifyGitHubActionsOidcToken(
  token: string,
): Promise<GitHubActionsOidcVerification> {
  const allowedRepositories = parseAllowedRepositories(
    process.env.QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES,
  );

  const { payload } = await jwtVerify(token, GITHUB_ACTIONS_OIDC_JWKS, {
    issuer: GITHUB_ACTIONS_OIDC_ISSUER,
    audience: getAcceptedAudiences(process.env),
  });

  const repositoryClaim = getStringClaim(payload, "repository");
  const normalizedRepository = assertAllowedRepository(
    repositoryClaim,
    allowedRepositories,
  );
  const workflowRef = getStringClaim(payload, "job_workflow_ref");
  assertWorkflowRefMatchesRepository(workflowRef, normalizedRepository);

  return {
    normalizedRepository,
    payload,
    workflowRef,
  };
}

export const _internal = {
  DEFAULT_QUALITY_GATE_OIDC_AUDIENCE,
  normalizeRepositorySlug,
  parseAllowedRepositories,
  getStringClaim,
  getAcceptedAudiences,
  assertAllowedRepository,
  assertWorkflowRefMatchesRepository,
};
