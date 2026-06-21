import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_VERCEL_CLI_PACKAGE,
  REQUIRED_VERCEL_RUNTIME_ENV_NAMES,
  analyzeVercelEnvNameTarget,
  buildVercelEnvListInvocation,
  formatVercelEnvNameReport,
  parseArgs,
  parseVercelEnvListNames,
  resolveVercelCliPackage,
  runVercelEnvNameCheck,
} from "./check-vercel-env-names.mjs";

const SAMPLE_ENV_LIST = `
 name                                       value               environments                        created
 MAINTENANCE_BYPASS_SECRET                  Encrypted           Preview                             19h ago
 MAINTENANCE_UNLOCK_PASSWORD                Encrypted           Preview                             19h ago
 CRON_SECRET                                Encrypted           Preview                             60d ago
 CLOUDFLARE_API_TOKEN                       Encrypted           Preview                             60d ago
 ALGOLIA_SYNC_SECRET                        Encrypted           Preview                             76d ago
 STRIPE_SECRET_KEY                          Encrypted           Preview                             76d ago
 EMAIL_REPLY_TO                             Encrypted           Preview                             76d ago
 EMAIL_FROM                                 Encrypted           Preview                             76d ago
 RESEND_API_KEY                             Encrypted           Preview                             76d ago
 ALGOLIA_ADMIN_KEY                          Encrypted           Preview                             76d ago
 STRIPE_WEBHOOK_SECRET                      Encrypted           Preview                             76d ago
 NEXT_PUBLIC_APP_URL                        Encrypted           Preview                             76d ago
 SUPABASE_SERVICE_ROLE_KEY                  Encrypted           Preview                             76d ago
 NEXT_PUBLIC_SUPABASE_ANON_KEY              Encrypted           Preview                             101d ago
 NEXT_PUBLIC_SUPABASE_URL                   Encrypted           Preview                             101d ago
 NEXT_PUBLIC_ALGOLIA_APP_ID                 Encrypted           Preview                             101d ago
 UPSTASH_REDIS_REST_TOKEN                   Encrypted           Preview                             114d ago
 UPSTASH_REDIS_REST_URL                     Encrypted           Preview                             114d ago
 NEXT_PUBLIC_ALGOLIA_SEARCH_KEY             Encrypted           Preview                             156d ago
 CLOUDFLARE_ACCOUNT_ID                      Encrypted           Development, Preview, Production    160d ago

Vercel CLI 50.4.5
Retrieving project...
> Environment Variables found for team/project [255ms]
`;

test("parseVercelEnvListNames extracts names without values or CLI footer noise", () => {
  const names = parseVercelEnvListNames(SAMPLE_ENV_LIST);

  assert.equal(names.has("STRIPE_SECRET_KEY"), true);
  assert.equal(names.has("UPSTASH_REDIS_REST_TOKEN"), true);
  assert.equal(names.has("Encrypted"), false);
  assert.equal(names.has("Vercel"), false);
});

test("analyzeVercelEnvNameTarget passes when all required metadata names exist", () => {
  const result = analyzeVercelEnvNameTarget({
    target: "preview",
    output: SAMPLE_ENV_LIST,
    requiredNames: REQUIRED_VERCEL_RUNTIME_ENV_NAMES,
  });

  assert.equal(result.ok, true);
  assert.equal(result.checkedNames.length, 20);
  assert.equal(result.missingNames.length, 0);
});

test("analyzeVercelEnvNameTarget reports missing names", () => {
  const result = analyzeVercelEnvNameTarget({
    target: "production",
    output: " STRIPE_SECRET_KEY Encrypted Production 1d ago\n",
    requiredNames: ["STRIPE_SECRET_KEY", "RESEND_API_KEY"],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingNames, ["RESEND_API_KEY"]);
});

test("runVercelEnvNameCheck continues across targets and keeps values out of output", () => {
  const result = runVercelEnvNameCheck({
    requirements: [
      { target: "preview", requiredNames: ["STRIPE_SECRET_KEY"] },
      { target: "production", requiredNames: ["STRIPE_SECRET_KEY", "RESEND_API_KEY"] },
    ],
    listTargetEnv({ target }) {
      if (target === "preview") {
        return {
          exitCode: 0,
          stdout: " STRIPE_SECRET_KEY Encrypted Preview 1d ago\n",
          stderr: "",
        };
      }

      return {
        exitCode: 1,
        stdout: "",
        stderr: "not logged in",
      };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.targets[0].ok, true);
  assert.equal(result.targets[1].listFailed, true);

  const report = formatVercelEnvNameReport(result);
  assert.match(report, /vercel-env-names: BLOCKED/u);
  assert.match(report, /not logged in/u);
  assert.doesNotMatch(report, /sk_live|re_|whsec_/u);
});

test("buildVercelEnvListInvocation wraps npx on Windows without shell mode", () => {
  assert.deepEqual(buildVercelEnvListInvocation("preview", "win32"), {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", `npx ${DEFAULT_VERCEL_CLI_PACKAGE} env ls preview`],
  });
  assert.deepEqual(buildVercelEnvListInvocation("production", "linux"), {
    command: "npx",
    args: [DEFAULT_VERCEL_CLI_PACKAGE, "env", "ls", "production"],
  });
});

test("resolveVercelCliPackage defaults to the verified stable package and supports override", () => {
  assert.equal(resolveVercelCliPackage({}), DEFAULT_VERCEL_CLI_PACKAGE);
  assert.equal(
    resolveVercelCliPackage({ VERCEL_CLI_PACKAGE: " vercel@latest " }),
    "vercel@latest",
  );
});

test("parseArgs supports json and help", () => {
  assert.deepEqual(parseArgs(["--json"]), { json: true, help: false });
  assert.deepEqual(parseArgs(["--help"]), { json: false, help: true });
});
