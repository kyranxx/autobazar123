import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  findSessionFileByThreadId,
  getCurrentChatModel,
  parseArgs,
  readSessionDetails,
  resolveThreadId,
} from "./current-chat-model.mjs";

function makeTempCodexHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codex-current-chat-model-"));
}

function writeSessionFile(rootDir, threadId, lines) {
  const sessionDir = path.join(rootDir, "sessions", "2026", "03", "07");
  fs.mkdirSync(sessionDir, { recursive: true });

  const sessionFile = path.join(
    sessionDir,
    `rollout-2026-03-07T12-35-28-${threadId}.jsonl`,
  );

  fs.writeFileSync(sessionFile, `${lines.join("\n")}\n`, "utf8");
  return sessionFile;
}

test("parseArgs reads supported flags", () => {
  const options = parseArgs(["--json", "--thread-id", "thread-123", "--value-only"]);

  assert.deepEqual(options, {
    json: true,
    valueOnly: true,
    threadId: "thread-123",
  });
});

test("resolveThreadId prefers explicit arg and falls back to CODEX_THREAD_ID", () => {
  assert.equal(
    resolveThreadId({ threadId: "thread-from-arg" }, { CODEX_THREAD_ID: "thread-from-env" }),
    "thread-from-arg",
  );
  assert.equal(
    resolveThreadId({ threadId: null }, { CODEX_THREAD_ID: "thread-from-env" }),
    "thread-from-env",
  );
});

test("findSessionFileByThreadId locates the matching session log", () => {
  const codexHome = makeTempCodexHome();
  const threadId = "thread-find";
  const sessionFile = writeSessionFile(codexHome, threadId, []);

  assert.equal(findSessionFileByThreadId(codexHome, threadId), sessionFile);
});

test("readSessionDetails returns the latest turn_context model", async () => {
  const codexHome = makeTempCodexHome();
  const threadId = "thread-read";
  const sessionFile = writeSessionFile(codexHome, threadId, [
    JSON.stringify({
      type: "session_meta",
      payload: {
        id: threadId,
        model_provider: "openai",
        source: "vscode",
        cwd: "c:\\repo",
      },
    }),
    JSON.stringify({
      type: "turn_context",
      payload: {
        turn_id: "turn-1",
        model: "gpt-5.3-codex",
      },
    }),
    JSON.stringify({
      type: "turn_context",
      payload: {
        turn_id: "turn-2",
        model: "gpt-5.4",
      },
    }),
  ]);

  const details = await readSessionDetails(sessionFile);

  assert.equal(details.model, "gpt-5.4");
  assert.equal(details.turnId, "turn-2");
  assert.equal(details.provider, "openai");
  assert.equal(details.source, "vscode");
});

test("getCurrentChatModel reads the current chat thread from env", async () => {
  const codexHome = makeTempCodexHome();
  const threadId = "thread-current";

  writeSessionFile(codexHome, threadId, [
    JSON.stringify({
      type: "session_meta",
      payload: {
        id: threadId,
        model_provider: "openai",
        source: "vscode",
        cwd: "c:\\repo",
      },
    }),
    JSON.stringify({
      type: "turn_context",
      payload: {
        turn_id: "turn-live",
        model: "gpt-5.4",
      },
    }),
  ]);

  const details = await getCurrentChatModel({
    argv: [],
    env: { CODEX_THREAD_ID: threadId },
    codexHome,
  });

  assert.equal(details.threadId, threadId);
  assert.equal(details.model, "gpt-5.4");
});
