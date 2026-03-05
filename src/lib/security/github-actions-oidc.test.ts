import { describe, expect, it } from "vitest";
import { _internal } from "./github-actions-oidc";

describe("github actions oidc helpers", () => {
  it("normalizes repository slugs", () => {
    expect(_internal.normalizeRepositorySlug("  Owner/Repo  ")).toBe("owner/repo");
  });

  it("parses allowed repository list from env-style string", () => {
    expect(
      _internal.parseAllowedRepositories(" Owner/Repo,another/repo ,, TEAM/App "),
    ).toEqual(["owner/repo", "another/repo", "team/app"]);
  });

  it("accepts repository claim when allowlist contains it", () => {
    expect(
      _internal.assertAllowedRepository("Owner/Repo", ["owner/repo", "team/app"]),
    ).toBe("owner/repo");
  });

  it("rejects missing repository claim", () => {
    expect(() => _internal.assertAllowedRepository(null, ["owner/repo"])).toThrow(
      /missing repository claim/i,
    );
  });

  it("rejects empty allowlist to fail closed", () => {
    expect(() => _internal.assertAllowedRepository("owner/repo", [])).toThrow(
      /ALLOWED_REPOSITORIES|not configured/i,
    );
  });

  it("rejects workflow refs that do not match repository claim", () => {
    expect(() =>
      _internal.assertWorkflowRefMatchesRepository(
        "another/repo/.github/workflows/x.yml@refs/heads/main",
        "owner/repo",
      ),
    ).toThrow(/does not match repository claim/i);
  });

  it("allows null workflow refs because claim availability can vary", () => {
    expect(() =>
      _internal.assertWorkflowRefMatchesRepository(null, "owner/repo"),
    ).not.toThrow();
  });
});
