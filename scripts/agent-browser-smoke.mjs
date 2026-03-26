import { spawn } from "node:child_process";
import path from "node:path";

const baseUrl = process.env.TEST_URL || "http://localhost:3000";
const routes = ["/", "/auth/login", "/auth/register", "/pridat-inzerat", "/vysledky"];
const sessionName = "smoke-launch";
const cliPath = path.join(
  process.cwd(),
  "node_modules",
  "agent-browser",
  "bin",
  "agent-browser.js",
);

function buildUrl(route) {
  return new URL(route, baseUrl).toString();
}

async function assertRouteResponds(url) {
  let response;

  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot reach ${url}. Start the app or set TEST_URL before running this smoke check. ${detail}`,
    );
  }

  if (!response.ok) {
    throw new Error(`Route ${url} returned HTTP ${response.status}`);
  }
}

function runAgentBrowser(args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      const result = {
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };

      if (result.code !== 0 && !allowFailure) {
        const detail = result.stderr || result.stdout || `exit code ${result.code}`;
        reject(new Error(detail));
        return;
      }

      resolve(result);
    });
  });
}

async function runBrowserCommand(commandArgs, options) {
  return runAgentBrowser(["--session", sessionName, ...commandArgs], options);
}

function parseSnapshotOutput(stdout) {
  if (!stdout) {
    return "";
  }

  try {
    const parsed = JSON.parse(stdout);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.tree === "string") {
        return parsed.tree;
      }
      if (typeof parsed.output === "string") {
        return parsed.output;
      }
    }
  } catch {
    // Fall back to raw output when the CLI does not emit JSON.
  }

  return stdout;
}

async function run() {
  try {
    for (const route of routes) {
      const url = buildUrl(route);
      console.log(`Checking route: ${url}`);

      await assertRouteResponds(url);
      await runBrowserCommand(["open", url]);
      await runBrowserCommand(["wait", "--load", "domcontentloaded"]);

      const snapshotResult = await runBrowserCommand([
        "snapshot",
        "-i",
        "-c",
        "-d",
        "6",
        "--json",
      ]);
      const snapshotText = parseSnapshotOutput(snapshotResult.stdout);

      if (!snapshotText.trim()) {
        throw new Error(`Interactive snapshot is empty for ${url}`);
      }
    }

    console.log("Agent-browser smoke checks passed.");
  } finally {
    await runBrowserCommand(["close"], { allowFailure: true }).catch(() => undefined);
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Agent-browser smoke checks failed: ${message}`);
  process.exit(1);
});
