#!/bin/bash
# Vercel Ignored Build Step
# Exit 0 → skip build. Exit 1 → proceed with build.
#
# Skips the Vercel deployment when every changed file is documentation-only
# (markdown, license, editor config, GitHub templates, etc.).
# Any change to app code, data, dependencies, or config triggers a deploy.

set -euo pipefail

# First deploy has no previous SHA — always build.
if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  echo "→ First deploy — building."
  exit 1
fi

# Vercel does a shallow clone (depth=10 by default). If the previous deploy
# SHA is older than the shallow window — common after long stretches of
# docs-only commits or after a rebase — git diff exits 128. Under set -e
# that aborts the whole gating script with code 128, which Vercel surfaces
# as "Command failed". Fail-safe to deploy when we can't compute the diff:
# missing a deploy is worse than running a redundant one.
if ! CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" 2>/dev/null); then
  echo "→ Could not compute diff against $VERCEL_GIT_PREVIOUS_SHA (shallow clone or missing SHA) — building."
  exit 1
fi

if [ -z "$CHANGED" ]; then
  echo "→ No changed files — skipping."
  exit 0
fi

# Patterns that never require a Vercel deploy
DOCS_PATTERN='^(.*\.md|LICENSE|CODE_OF_CONDUCT|\.github/.*|\.vscode/.*|\.editorconfig|\.prettierrc.*|\.prettierignore|public/llms\.txt)$'

while IFS= read -r file; do
  if ! echo "$file" | grep -qE "$DOCS_PATTERN"; then
    echo "→ Deploy triggered by: $file"
    exit 1
  fi
done <<< "$CHANGED"

echo "→ Docs-only change — skipping deploy."
exit 0
