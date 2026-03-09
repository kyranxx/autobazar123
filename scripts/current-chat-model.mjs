import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const options = {
    json: false,
    valueOnly: false,
    threadId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--value-only") {
      options.valueOnly = true;
      continue;
    }

    if (arg === "--thread-id") {
      options.threadId = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--thread-id=")) {
      options.threadId = arg.slice("--thread-id=".length) || null;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function resolveCodexHome(env = process.env) {
  if (env.CODEX_HOME?.trim()) {
    return env.CODEX_HOME.trim();
  }

  return path.join(os.homedir(), ".codex");
}

function resolveThreadId(options, env = process.env) {
  const threadId = options.threadId || env.CODEX_THREAD_ID;

  if (!threadId) {
    throw new Error(
      "Unable to determine the current Codex chat thread id. Run this inside a Codex chat terminal or pass --thread-id <id>.",
    );
  }

  return threadId;
}

function collectSessionMatches(rootDir, threadId, matches) {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      collectSessionMatches(fullPath, threadId, matches);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".jsonl") && entry.name.includes(threadId)) {
      matches.push(fullPath);
    }
  }
}

function findSessionFileByThreadId(codexHome, threadId) {
  const matches = [];

  collectSessionMatches(path.join(codexHome, "sessions"), threadId, matches);
  collectSessionMatches(path.join(codexHome, "archived_sessions"), threadId, matches);

  if (matches.length === 0) {
    throw new Error(
      `No Codex session log was found for thread ${threadId} under ${codexHome}.`,
    );
  }

  matches.sort((left, right) => {
    const leftMtime = fs.statSync(left).mtimeMs;
    const rightMtime = fs.statSync(right).mtimeMs;
    return rightMtime - leftMtime;
  });

  return matches[0];
}

async function readSessionDetails(sessionFile) {
  let sessionMeta = null;
  let latestTurnContext = null;

  const stream = fs.createReadStream(sessionFile, { encoding: "utf8" });
  const lineReader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of lineReader) {
      if (!line.trim()) {
        continue;
      }

      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }

      if (record.type === "session_meta" && record.payload && !sessionMeta) {
        sessionMeta = record.payload;
      }

      if (record.type === "turn_context" && typeof record.payload?.model === "string") {
        latestTurnContext = record.payload;
      }
    }
  } finally {
    lineReader.close();
  }

  if (!latestTurnContext) {
    throw new Error(`No turn_context model entry was found in ${sessionFile}.`);
  }

  return {
    threadId: sessionMeta?.id || null,
    turnId: latestTurnContext.turn_id || null,
    model: latestTurnContext.model,
    provider: sessionMeta?.model_provider || null,
    source: sessionMeta?.source || null,
    cwd: sessionMeta?.cwd || latestTurnContext.cwd || null,
    sessionFile,
  };
}

export async function getCurrentChatModel({
  argv = process.argv.slice(2),
  env = process.env,
  codexHome = resolveCodexHome(env),
} = {}) {
  const options = parseArgs(argv);
  const threadId = resolveThreadId(options, env);
  const sessionFile = findSessionFileByThreadId(codexHome, threadId);
  const details = await readSessionDetails(sessionFile);

  return {
    ...details,
    threadId,
  };
}

function renderOutput(details, options) {
  if (options.json) {
    return JSON.stringify(details, null, 2);
  }

  if (options.valueOnly) {
    return details.model;
  }

  return [
    `CURRENT CHAT MODEL: ${details.model}`,
    `thread_id: ${details.threadId}`,
    `provider: ${details.provider || "unknown"}`,
    `source: ${details.source || "unknown"}`,
    `session_file: ${details.sessionFile}`,
  ].join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const details = await getCurrentChatModel({
    argv: process.argv.slice(2),
  });
  console.log(renderOutput(details, options));
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(`CURRENT CHAT MODEL CHECK FAILED: ${error.message}`);
    process.exit(1);
  });
}

export {
  findSessionFileByThreadId,
  parseArgs,
  readSessionDetails,
  renderOutput,
  resolveCodexHome,
  resolveThreadId,
};
