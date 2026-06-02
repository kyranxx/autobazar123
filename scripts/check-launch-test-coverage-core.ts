export type AccountRole = "primary" | "admin" | "non-admin" | "seller" | "dealer";

export type AccountDefinition = {
  role: AccountRole;
  label: string;
  emailEnv: string;
  passwordEnv: string;
};

export type AccountCheck = {
  definition: AccountDefinition;
  configured: boolean;
  profileFound: boolean;
  isAdmin: boolean;
  isDealer: boolean;
  adCount: number;
};

export type CandidateSummary = {
  profiles: number;
  nonAdminProfiles: number;
  sellerProfilesWithAds: number;
  dealerOwners: number;
};

type CandidateRows = {
  profiles: Record<string, unknown>[];
  admins: Record<string, unknown>[];
  dealers: Record<string, unknown>[];
  ads: Record<string, unknown>[];
};

export function compactStringSet(
  rows: Record<string, unknown>[],
  column: string,
): Set<string> {
  return new Set(
    rows
      .map((row) => row[column])
      .filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      ),
  );
}

export function summarizeCandidateRows(rows: CandidateRows): CandidateSummary {
  const profileIds = compactStringSet(rows.profiles, "id");
  const adminIds = compactStringSet(rows.admins, "user_id");
  const dealerOwnerIds = compactStringSet(rows.dealers, "owner_id");
  const adSellerIds = compactStringSet(rows.ads, "seller_id");
  const nonAdminProfileIds = [...profileIds].filter((id) => !adminIds.has(id));
  const sellerProfilesWithAds = nonAdminProfileIds.filter((id) =>
    adSellerIds.has(id),
  );

  return {
    profiles: profileIds.size,
    nonAdminProfiles: nonAdminProfileIds.length,
    sellerProfilesWithAds: sellerProfilesWithAds.length,
    dealerOwners: dealerOwnerIds.size,
  };
}

export function findCoverage(
  checks: AccountCheck[],
  env: Record<string, string | undefined> = process.env,
) {
  const primary = checks.find((check) => check.definition.role === "primary");
  const admin =
    checks.find((check) => check.definition.role === "admin" && check.isAdmin) ??
    (env.E2E_AUTH_IS_ADMIN === "true" && primary?.isAdmin ? primary : undefined);
  const nonAdmin =
    checks.find(
      (check) =>
        check.definition.role === "non-admin" &&
        check.profileFound &&
        !check.isAdmin,
    ) ??
    (env.E2E_AUTH_IS_ADMIN !== "true" && primary?.profileFound && !primary.isAdmin
      ? primary
      : undefined);
  const seller =
    checks.find(
      (check) =>
        check.definition.role === "seller" &&
        check.profileFound &&
        check.adCount > 0,
    ) ?? (primary?.profileFound && primary.adCount > 0 ? primary : undefined);
  const dealer =
    checks.find(
      (check) =>
        check.definition.role === "dealer" &&
        check.profileFound &&
        check.isDealer,
    ) ?? (primary?.profileFound && primary.isDealer ? primary : undefined);

  return {
    primary: Boolean(primary?.profileFound),
    admin: Boolean(admin),
    nonAdmin: Boolean(nonAdmin),
    sellerWithAd: Boolean(seller),
    dealer: Boolean(dealer),
  };
}
