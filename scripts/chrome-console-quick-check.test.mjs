import test from "node:test";
import assert from "node:assert/strict";
import {
  countIssues,
  parseArgs,
  POST_LOGIN_CONTINUE_LABEL,
  renderMarkdown,
  shouldKeepChromeLogEntry,
} from "./chrome-console-quick-check.mjs";

test("parseArgs supports headed, fail-on-issues, and base-url", () => {
  const result = parseArgs([
    "--headed",
    "--fail-on-issues",
    "--base-url=https://autobazar123.sk",
  ]);

  assert.equal(result.headed, true);
  assert.equal(result.failOnIssues, true);
  assert.equal(result.baseUrl, "https://autobazar123.sk");
});

test("shouldKeepChromeLogEntry keeps violation and warning entries", () => {
  assert.equal(
    shouldKeepChromeLogEntry({
      source: "violation",
      level: "info",
      text: "Long task took 80ms",
    }),
    true,
  );

  assert.equal(
    shouldKeepChromeLogEntry({
      source: "javascript",
      level: "warning",
      text: "Deprecated API used",
    }),
    true,
  );
});

test("shouldKeepChromeLogEntry drops ignored noise", () => {
  assert.equal(
    shouldKeepChromeLogEntry({
      source: "javascript",
      level: "warning",
      text: "Download the React DevTools for a better development experience",
    }),
    false,
  );
});

test("post-login continue selector does not match social Google CTA text", () => {
  assert.equal(POST_LOGIN_CONTINUE_LABEL.test("Continue"), true);
  assert.equal(POST_LOGIN_CONTINUE_LABEL.test("Pokracovat"), true);
  assert.equal(POST_LOGIN_CONTINUE_LABEL.test("Continue with Google"), false);
});

test("countIssues and renderMarkdown summarize report content", () => {
  const result = {
    label: "Frontpage",
    status: "issues",
    requestedUrl: "http://localhost:3000/",
    finalUrl: "http://localhost:3000/",
    navigationStatus: 200,
    notes: ["sample"],
    consoleMessages: [{ type: "warning", text: "warn", location: undefined }],
    pageErrors: ["boom"],
    networkFailures: [],
    devtoolsIssues: [{ code: "MixedContentIssue", summary: "mixed content" }],
    chromeLogs: [{ level: "info", source: "violation", text: "long task", location: undefined }],
  };

  assert.equal(countIssues(result), 4);

  const markdown = renderMarkdown({
    generatedAt: "2026-03-14T12:00:00.000Z",
    baseUrl: "http://localhost:3000",
    browserName: "chrome",
    listingPath: "/auto/test",
    results: [result],
  });

  assert.match(markdown, /Chrome Console Quick Check/);
  assert.match(markdown, /\| Frontpage \| issues \| 4 \|/);
  assert.match(markdown, /MixedContentIssue/);
  assert.match(markdown, /long task/);
});
