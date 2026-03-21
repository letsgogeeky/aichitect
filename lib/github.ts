export interface GitHubToolData {
  stars: number;
  last_commit_at: string; // ISO string (pushed_at)
  open_issues: number;
  forks: number;
  archived: boolean;
  license: string | null; // SPDX identifier
}

/**
 * Parses a GitHub URL into { owner, repo }.
 * Handles trailing slashes, query params, and tree/blob paths.
 * Returns null for non-GitHub URLs or malformed inputs.
 */
export function parseGitHubOwnerRepo(url: string): { owner: string; repo: string } | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "github.com") return null;
    const parts = pathname.replace(/^\//, "").split("/");
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status >= 500 && retries > 0) {
    await new Promise((r) => setTimeout(r, 2000));
    return fetchWithRetry(url, options, retries - 1);
  }
  return res;
}

/**
 * Fetches live health metadata for a tool from the GitHub REST API v3.
 * Returns null on 404 (not found), 403 (private/forbidden), 429 (rate limited),
 * or any network/parse error. Never throws.
 */
export async function fetchToolGitHubData(githubUrl: string): Promise<GitHubToolData | null> {
  const parsed = parseGitHubOwnerRepo(githubUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  };

  try {
    const res = await fetchWithRetry(apiUrl, { headers });

    if (res.status === 429) {
      const reset = res.headers.get("X-RateLimit-Reset");
      const resetTime = reset ? new Date(parseInt(reset) * 1000).toISOString() : "unknown";
      console.warn(`[github] Rate limited fetching ${owner}/${repo}. Resets at ${resetTime}`);
      return null;
    }

    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) return null;

    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      last_commit_at: data.pushed_at ?? new Date().toISOString(),
      open_issues: data.open_issues_count ?? 0,
      forks: data.forks_count ?? 0,
      archived: data.archived ?? false,
      license: data.license?.spdx_id ?? null,
    };
  } catch {
    return null;
  }
}
