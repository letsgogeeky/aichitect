#!/usr/bin/env bash
# Deploys the app to Cloudflare Workers (aichitect-web). Runs on the HOST,
# not in Docker -- same deliberate exception as Thoth's and Sopdet's deploy
# scripts: OpenNext bakes absolute build-context paths into the bundle, so
# build and `wrangler deploy` must run in the same filesystem context as
# wrangler's Cloudflare auth (the host), and workerd's native binary needs
# the host's own OS/arch build, not the container's.
#
# Usage:
#   scripts/deploy.sh               # interactive, runs make check first
#   scripts/deploy.sh -y            # skip the confirmation prompt
#   scripts/deploy.sh --skip-checks # skip make check (not recommended)
#
# Requires on the host: `wrangler` logged in (or CLOUDFLARE_API_TOKEN set),
# and .env.local with NEXT_PUBLIC_POSTGRES_SUPABASE_URL /
# NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY -- `next build` reads .env.local
# itself and inlines NEXT_PUBLIC_* values into the client bundle, so a build
# without them ships a site whose browser-side Supabase calls all fail.
# Runtime secrets (service role key, CRON_SECRET, ...) are Worker secrets
# (`wrangler secret put`), not read from here.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SKIP_CHECKS=false
ASSUME_YES=false
for arg in "$@"; do
  case "$arg" in
    --skip-checks) SKIP_CHECKS=true ;;
    -y | --yes) ASSUME_YES=true ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [-y|--yes] [--skip-checks]" >&2
      exit 1
      ;;
  esac
done

for var in NEXT_PUBLIC_POSTGRES_SUPABASE_URL NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY; do
  if ! grep -q "^$var=..*" .env.local 2>/dev/null; then
    echo "error: $var missing or empty in .env.local (see .env.example)" >&2
    exit 1
  fi
done

echo "== Git state =="
echo "branch: $(git rev-parse --abbrev-ref HEAD)  commit: $(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ]; then
  echo
  echo "WARNING: uncommitted changes present -- this deploy includes them, but they are NOT in git history:"
  git status --short
fi
echo

if [ "$SKIP_CHECKS" = true ]; then
  echo "== Skipping make check (--skip-checks) =="
else
  echo "== make check (lint + typecheck + test + audit) =="
  make check
fi
echo

if [ "$ASSUME_YES" = false ]; then
  read -r -p "Deploy aichitect-web to Cloudflare now? Type 'yes': " ans
  if [ "$ans" != "yes" ]; then
    echo "Aborted."
    exit 1
  fi
fi

# Host node_modules must be the host's own platform build (workerd,
# esbuild, ...). docker-compose mounts an anonymous volume over
# /app/node_modules, so the container's Linux install never touches this one.
if [ ! -x "node_modules/.bin/opennextjs-cloudflare" ]; then
  echo "== Host node_modules missing/incomplete -- running npm ci =="
  npm ci
fi

echo "== Cleaning previous build output =="
rm -rf .next .open-next

echo "== opennextjs-cloudflare build (runs next build) =="
NODE_ENV=production npx opennextjs-cloudflare build

echo "== wrangler deploy =="
npx wrangler deploy

echo
echo "== Smoke test =="
sleep 3
FAILED=false
for url in "https://aichitect.dev" "https://aichitect.dev/api/feed"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$url" || echo "000")
  echo "$url -> $CODE"
  [ "$CODE" = "200" ] || FAILED=true
done
if [ "$FAILED" = true ]; then
  echo "WARNING: smoke test failed. Roll back with:"
  echo "  npx wrangler deployments list --name aichitect-web"
  echo "  npx wrangler rollback <previous-version-id>"
  exit 1
fi
