import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import {
  type AccountCheck,
  type AccountDefinition,
  type AccountRole,
  type CandidateSummary,
  findCoverage,
  summarizeCandidateRows,
} from "./check-launch-test-coverage-core";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

type ServiceClient = ReturnType<typeof createServiceClient>;

const accountDefinitions: AccountDefinition[] = [
  {
    role: "primary",
    label: "primary authenticated account",
    emailEnv: "E2E_AUTH_EMAIL",
    passwordEnv: "E2E_AUTH_PASSWORD",
  },
  {
    role: "admin",
    label: "admin account",
    emailEnv: "E2E_ADMIN_EMAIL",
    passwordEnv: "E2E_ADMIN_PASSWORD",
  },
  {
    role: "non-admin",
    label: "non-admin account",
    emailEnv: "E2E_NON_ADMIN_EMAIL",
    passwordEnv: "E2E_NON_ADMIN_PASSWORD",
  },
  {
    role: "seller",
    label: "seller with owned ad account",
    emailEnv: "E2E_SELLER_EMAIL",
    passwordEnv: "E2E_SELLER_PASSWORD",
  },
  {
    role: "dealer",
    label: "dealer account",
    emailEnv: "E2E_DEALER_EMAIL",
    passwordEnv: "E2E_DEALER_PASSWORD",
  },
];

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for read-only coverage check.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function hasEnvPair(definition: AccountDefinition): boolean {
  const email = process.env[definition.emailEnv] ?? "";
  const password = process.env[definition.passwordEnv] ?? "";
  return email.trim().length > 0 && password.trim().length > 0;
}

function envEmail(definition: AccountDefinition): string | null {
  const email = process.env[definition.emailEnv] ?? "";
  return email.trim().length > 0 ? email.trim().toLowerCase() : null;
}

async function findProfileIdByEmail(
  supabase: ServiceClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.id === "string" ? data.id : null;
}

async function countRows(
  supabase: ServiceClient,
  table: "profiles" | "site_admins" | "dealers" | "ads",
  column: "id" | "user_id" | "owner_id" | "seller_id",
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchAllRows(
  supabase: ServiceClient,
  table: "profiles" | "site_admins" | "dealers" | "ads",
  select: string,
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }
  }
}

async function summarizeCandidateData(
  supabase: ServiceClient,
): Promise<CandidateSummary> {
  const [profiles, admins, dealers, ads] = await Promise.all([
    fetchAllRows(supabase, "profiles", "id"),
    fetchAllRows(supabase, "site_admins", "user_id"),
    fetchAllRows(supabase, "dealers", "owner_id"),
    fetchAllRows(supabase, "ads", "seller_id"),
  ]);

  return summarizeCandidateRows({ profiles, admins, dealers, ads });
}

async function checkAccount(
  definition: AccountDefinition,
  supabase: ServiceClient,
): Promise<AccountCheck> {
  const configured = hasEnvPair(definition);
  const email = envEmail(definition);
  const profileId = email ? await findProfileIdByEmail(supabase, email) : null;

  if (!configured || !profileId) {
    return {
      definition,
      configured,
      profileFound: Boolean(profileId),
      isAdmin: false,
      isDealer: false,
      adCount: 0,
    };
  }

  const [profileCount, adminCount, dealerCount, adCount] = await Promise.all([
    countRows(supabase, "profiles", "id", profileId),
    countRows(supabase, "site_admins", "user_id", profileId),
    countRows(supabase, "dealers", "owner_id", profileId),
    countRows(supabase, "ads", "seller_id", profileId),
  ]);

  return {
    definition,
    configured,
    profileFound: profileCount > 0,
    isAdmin: adminCount > 0,
    isDealer: dealerCount > 0,
    adCount,
  };
}

function status(value: boolean): "yes" | "no" {
  return value ? "yes" : "no";
}

function reportError(error: unknown) {
  if (error instanceof Error) {
    const record = error as Error & Record<string, unknown>;
    console.error(
      JSON.stringify({
        name: error.name,
        message: error.message,
        status: record.status,
        code: record.code,
      }),
    );
    return;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    console.error(
      JSON.stringify({
        name: record.name,
        message: record.message,
        status: record.status,
        code: record.code,
      }),
    );
    return;
  }

  console.error(JSON.stringify(error));
}

async function main() {
  const requireComplete = process.argv.includes("--require-complete");
  const supabase = createServiceClient();
  const checks = await Promise.all(
    accountDefinitions.map((definition) => checkAccount(definition, supabase)),
  );
  const candidates = await summarizeCandidateData(supabase);
  const coverage = findCoverage(checks, process.env);
  const complete = Object.values(coverage).every(Boolean);

  console.log("Launch test account coverage");
  console.log("");
  console.log("Configured account checks:");
  for (const check of checks) {
    console.log(`- ${check.definition.label}`);
    console.log(`  env: ${status(check.configured)}`);
    console.log(`  profile: ${status(check.profileFound)}`);
    console.log(`  admin: ${status(check.isAdmin)}`);
    console.log(`  dealer: ${status(check.isDealer)}`);
    console.log(`  owned ads: ${check.adCount}`);
  }

  console.log("");
  console.log("Coverage gates:");
  console.log(`- primary login account: ${status(coverage.primary)}`);
  console.log(`- admin dashboard account: ${status(coverage.admin)}`);
  console.log(`- non-admin admin-denial account: ${status(coverage.nonAdmin)}`);
  console.log(`- seller account with owned ad: ${status(coverage.sellerWithAd)}`);
  console.log(`- dealer account: ${status(coverage.dealer)}`);
  console.log("");
  console.log("Read-only DB candidate data:");
  console.log(`- profiles: ${candidates.profiles}`);
  console.log(`- non-admin profiles: ${candidates.nonAdminProfiles}`);
  console.log(
    `- non-admin seller profiles with owned ads: ${candidates.sellerProfilesWithAds}`,
  );
  console.log(`- dealer owners: ${candidates.dealerOwners}`);
  console.log("");
  console.log(`Complete launch test account coverage: ${status(complete)}`);

  if (!complete && requireComplete) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  reportError(error);
  process.exitCode = 1;
});
