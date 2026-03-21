import { describe, it, expect } from "vitest";
import { parseGitHubOwnerRepo } from "@/lib/github";

describe("parseGitHubOwnerRepo", () => {
  it("parses a standard GitHub URL", () => {
    expect(parseGitHubOwnerRepo("https://github.com/langchain-ai/langchain")).toEqual({
      owner: "langchain-ai",
      repo: "langchain",
    });
  });

  it("handles trailing slashes", () => {
    expect(parseGitHubOwnerRepo("https://github.com/vercel/next.js/")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("handles deep paths (tree, blob, etc.)", () => {
    expect(parseGitHubOwnerRepo("https://github.com/supabase/supabase/tree/main/packages")).toEqual(
      {
        owner: "supabase",
        repo: "supabase",
      }
    );
  });

  it("strips .git suffix", () => {
    expect(parseGitHubOwnerRepo("https://github.com/owner/repo.git")).toEqual({
      owner: "owner",
      repo: "repo",
    });
  });

  it("returns null for non-GitHub URLs", () => {
    expect(parseGitHubOwnerRepo("https://gitlab.com/owner/repo")).toBeNull();
  });

  it("returns null for GitHub URLs without a repo", () => {
    expect(parseGitHubOwnerRepo("https://github.com/owner")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseGitHubOwnerRepo("not a url")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseGitHubOwnerRepo("")).toBeNull();
  });
});
