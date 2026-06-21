import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import path from "node:path";

import {
  evaluateLiveRlsPosture,
  type LiveRlsProbeResult,
} from "./check-live-rls-posture-core";

type ProbeDefinition = {
  name: string;
  target: string;
  table: string;
  columns: string;
};

const PROBES: ProbeDefinition[] = [
  {
    name: "profiles.email",
    target: "public.profiles.email",
    table: "profiles",
    columns: "email",
  },
  {
    name: "profiles.phone",
    target: "public.profiles.phone",
    table: "profiles",
    columns: "phone",
  },
  {
    name: "profiles.credit_balance",
    target: "public.profiles.credit_balance",
    table: "profiles",
    columns: "credit_balance",
  },
  {
    name: "dealers raw table",
    target: "public.dealers",
    table: "dealers",
    columns: "id",
  },
];

loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function isJsonMode(): boolean {
  return process.argv.includes("--json");
}

function isHelpMode(): boolean {
  return process.argv.includes("--help") || process.argv.includes("-h");
}

function printHelp(): void {
  console.log(`Usage: npm run check:live-rls-posture -- [--json]

Runs read-only Supabase anon-key probes for launch-blocking profile/dealer RLS posture.
The command reports counts and statuses only; it does not print returned row values.`);
}

async function runProbe(
  supabase: SupabaseClient,
  probe: ProbeDefinition,
): Promise<LiveRlsProbeResult> {
  try {
    const { data, error } = await supabase
      .from(probe.table)
      .select(probe.columns)
      .limit(1);

    return {
      name: probe.name,
      target: probe.target,
      rowCount: Array.isArray(data) ? data.length : 0,
      errorCode: error?.code,
      errorMessage: error?.message,
    };
  } catch (error) {
    return {
      name: probe.name,
      target: probe.target,
      rowCount: 0,
      probeError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  if (isHelpMode()) {
    printHelp();
    return;
  }

  const supabase = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const results = await Promise.all(
    PROBES.map((probe) => runProbe(supabase, probe)),
  );
  const evaluation = evaluateLiveRlsPosture(results);

  if (isJsonMode()) {
    console.log(JSON.stringify(evaluation, null, 2));
  } else {
    console.log("Live Supabase anon RLS posture");
    for (const probe of evaluation.probes) {
      const errorSuffix = probe.errorCode ? ` error=${probe.errorCode}` : "";
      console.log(
        `- ${probe.name}: ${probe.status}, rows=${probe.rowCount}${errorSuffix}`,
      );
    }
    console.log(evaluation.ok ? "- status: ok" : "- status: blocked");
    for (const error of evaluation.errors) {
      console.log(`  ${error}`);
    }
  }

  if (!evaluation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
