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

export type GitHubFetchError = "not_found" | "rate_limited" | "network" | "unknown";

export interface GitHubFetchResult {
  data: GitHubToolData | null;
  /** Populated when data is null — describes why the fetch failed. */
  error?: GitHubFetchError;
  /** Remaining API calls in the current window, from X-RateLimit-Remaining header. */
  rateLimitRemaining?: number;
}

/**
 * Fetches live health metadata for a tool from the GitHub REST API v3.
 * Never throws. Returns { data: null, error } on failure with a typed reason.
 */
export async function fetchToolGitHubData(githubUrl: string): Promise<GitHubFetchResult> {
  const parsed = parseGitHubOwnerRepo(githubUrl);
  if (!parsed) return { data: null, error: "not_found" };

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
    const remaining = res.headers.get("X-RateLimit-Remaining");
    const rateLimitRemaining = remaining !== null ? parseInt(remaining, 10) : undefined;

    if (res.status === 429 || (res.status === 403 && rateLimitRemaining === 0)) {
      const reset = res.headers.get("X-RateLimit-Reset");
      const resetTime = reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : "unknown";
      console.warn(`[github] Rate limited — ${owner}/${repo}. Resets at ${resetTime}`);
      return { data: null, error: "rate_limited", rateLimitRemaining: 0 };
    }

    if (res.status === 404 || res.status === 403) {
      return { data: null, error: "not_found", rateLimitRemaining };
    }
    if (!res.ok) {
      return { data: null, error: "unknown", rateLimitRemaining };
    }

    const json = await res.json();
    return {
      data: {
        stars: json.stargazers_count ?? 0,
        last_commit_at: json.pushed_at ?? new Date().toISOString(),
        open_issues: json.open_issues_count ?? 0,
        forks: json.forks_count ?? 0,
        archived: json.archived ?? false,
        license: json.license?.spdx_id ?? null,
      },
      rateLimitRemaining,
    };
  } catch {
    return { data: null, error: "network" };
  }
}
