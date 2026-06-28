import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import path from "node:path";

import {
  evaluateHumanInquiryProof,
  type HumanInquiryProofEvaluation,
  type HumanInquiryProofInquiry,
  validateSupabaseProjectUrl,
} from "./check-human-inquiry-proof-core";

const DEFAULT_AD_ID = "56e8e190-f13c-4398-8fb7-5183fc025aaa";
const DEFAULT_MESSAGE = "Human launch proof 2026-06-22";
const DEFAULT_BUYER_EMAIL = "qa.user3+202603022210@example.com";
const DEFAULT_SINCE_ISO = "2026-06-22T00:00:00.000Z";
const DEFAULT_SUPABASE_PROJECT_REF = "vxwbbzjlctjpzivfkdou";

type CliOptions = {
  adId: string;
  buyerEmail: string;
  message: string;
  sinceIso: string;
  supabaseProjectRef: string;
  json: boolean;
  help: boolean;
};

loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function readOption(args: string[], name: string): string | null {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length).trim();
  }

  const index = args.indexOf(name);
  if (index >= 0) {
    return args[index + 1]?.trim() ?? null;
  }

  return null;
}

function parseOptions(args: string[]): CliOptions {
  return {
    adId: readOption(args, "--ad-id") || DEFAULT_AD_ID,
    buyerEmail:
      readOption(args, "--buyer-email") ||
      process.env.E2E_NON_ADMIN_EMAIL?.trim() ||
      DEFAULT_BUYER_EMAIL,
    message: readOption(args, "--message") || DEFAULT_MESSAGE,
    sinceIso: readOption(args, "--since") || DEFAULT_SINCE_ISO,
    supabaseProjectRef:
      readOption(args, "--supabase-project-ref") ||
      process.env.E2E_SUPABASE_PROJECT_REF?.trim() ||
      DEFAULT_SUPABASE_PROJECT_REF,
    json: args.includes("--json"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

function printHelp(): void {
  console.log(`Usage: npm run check:human-inquiry-proof -- [--json] [--ad-id <id>] [--buyer-email <email>] [--message <text>] [--since <iso>] [--supabase-project-ref <ref>]

Runs a read-only Supabase service-role check for the manual Production buyer inquiry proof.
The command does not print buyer email or message text.`);
}

function reportHuman(evaluation: HumanInquiryProofEvaluation): void {
  console.log("Human Production inquiry proof");
  console.log(`- target listing found: ${evaluation.summary.adFound ? "yes" : "no"}`);
  console.log(`- buyer profile found: ${evaluation.summary.buyerFound ? "yes" : "no"}`);
  console.log(`- matching proof rows: ${evaluation.summary.matchingInquiries}`);
  console.log(`- fresh matching rows: ${evaluation.summary.freshMatchingInquiries}`);
  console.log(`- seller-routed rows: ${evaluation.summary.sellerRecipientMatches}`);
  if (evaluation.latestProof) {
    console.log(
      `- latest proof: ${evaluation.latestProof.id} at ${evaluation.latestProof.createdAt}`,
    );
  }
  console.log(evaluation.ok ? "- status: ok" : "- status: blocked");
  for (const error of evaluation.errors) {
    console.log(`  ${error}`);
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const urlErrors = validateSupabaseProjectUrl(supabaseUrl, options.supabaseProjectRef);
  if (urlErrors.length > 0) {
    throw new Error(urlErrors.join("\n"));
  }

  const supabase = createClient(supabaseUrl, getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const [{ data: ad, error: adError }, { data: buyer, error: buyerError }] =
    await Promise.all([
      supabase
        .from("ads")
        .select("id,seller_id")
        .eq("id", options.adId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id")
        .eq("email", options.buyerEmail)
        .maybeSingle(),
    ]);

  if (adError) {
    throw new Error(`Could not read target listing: ${adError.message}`);
  }
  if (buyerError) {
    throw new Error(`Could not read buyer profile: ${buyerError.message}`);
  }

  const { data: inquiries, error: inquiriesError } = await supabase
    .from("inquiries")
    .select("id,ad_id,sender_id,recipient_id,created_at")
    .eq("ad_id", options.adId)
    .eq("message", options.message)
    .gte("created_at", options.sinceIso)
    .order("created_at", { ascending: false })
    .limit(20);

  if (inquiriesError) {
    throw new Error(`Could not read inquiries: ${inquiriesError.message}`);
  }

  const evaluation = evaluateHumanInquiryProof({
    ad: {
      id: typeof ad?.id === "string" ? ad.id : null,
      sellerId: typeof ad?.seller_id === "string" ? ad.seller_id : null,
    },
    buyerProfile: {
      id: typeof buyer?.id === "string" ? buyer.id : null,
      found: Boolean(buyer?.id),
    },
    inquiries: ((inquiries ?? []) as Record<string, unknown>[]).map(
      (row): HumanInquiryProofInquiry => ({
        id: String(row.id ?? ""),
        adId: typeof row.ad_id === "string" ? row.ad_id : null,
        senderId: typeof row.sender_id === "string" ? row.sender_id : null,
        recipientId: typeof row.recipient_id === "string" ? row.recipient_id : null,
        createdAt: typeof row.created_at === "string" ? row.created_at : null,
      }),
    ),
    sinceIso: options.sinceIso,
  });

  if (options.json) {
    console.log(JSON.stringify(evaluation, null, 2));
  } else {
    reportHuman(evaluation);
  }

  if (!evaluation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
