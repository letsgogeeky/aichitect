COMPOSE = docker compose
LOCAL_DB_URL = postgresql://postgres:postgres@db:5432/aichitect

.PHONY: help run down restart build rebuild logs shell typecheck lint format check test sync-counts seed seed-local seed-validate db-push db-push-local db-diff db-diff-local db-migrate db-pull db-reset-local

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

run: ## Start the dev server in the foreground
	$(COMPOSE) up

down: ## Stop and remove containers
	$(COMPOSE) down

restart: ## Restart containers without rebuilding
	$(COMPOSE) restart

build: ## Build image (after package.json changes run 'make rebuild' instead)
	$(COMPOSE) build

rebuild: ## Full rebuild: install packages, build image, wipe volumes, start fresh
	docker run --rm -v "$(PWD):/app" -w /app node:20-alpine npm install
	$(COMPOSE) build
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	@echo "→ http://localhost:3000"

logs: ## Tail container logs
	$(COMPOSE) logs -f

shell: ## Open a shell inside the running container
	$(COMPOSE) exec app sh

typecheck: ## Run TypeScript type check inside container
	$(COMPOSE) run --rm app npx tsc --noEmit

lint: ## Run ESLint inside container
	$(COMPOSE) run --rm app npx eslint .

format: ## Format all files with Prettier inside container
	$(COMPOSE) run --rm app npx prettier --write .

test: ## Run tests with Vitest inside container
	$(COMPOSE) run --rm app npx vitest run

check: lint typecheck test ## Run all checks (lint + typecheck + test)

sync-counts: ## Sync tool/category/stack counts into README.md and CLAUDE.md
	node scripts/sync-counts.mjs

seed-validate: ## Validate JSON data integrity without a DB connection
	$(COMPOSE) run --rm app npx tsx scripts/seed-db.ts --validate

seed-local: ## Seed local Postgres container (no Supabase needed)
	$(COMPOSE) run --rm app npx tsx scripts/seed-db-local.ts

seed: ## Seed remote Supabase with data from data/*.json (idempotent)
	$(COMPOSE) run --rm app sh -c 'npx tsx scripts/seed-db.ts'

# ── Supabase / Database ───────────────────────────────────────────────────────
# Local target  → applies migrations to the local Postgres container (db service)
# Remote target → applies migrations to the hosted Supabase project
#
# Typical dev workflow:
#   make db-push-local   # verify migrations work locally first
#   make db-push         # promote to remote when satisfied

db-push-local: ## Apply pending migrations to local Postgres container
	$(COMPOSE) run --rm -e PGSSLMODE=disable app npx supabase db push --db-url "$(LOCAL_DB_URL)"

db-push: ## Apply pending migrations to remote Supabase project
	$(COMPOSE) run --rm app sh -c 'npx supabase db push --db-url "$$POSTGRES_URL_NON_POOLING"'

db-diff-local: ## Diff local migrations against local Postgres
	$(COMPOSE) run --rm -e PGSSLMODE=disable app npx supabase db diff --db-url "$(LOCAL_DB_URL)"

db-diff: ## Diff local migrations against remote Supabase schema
	$(COMPOSE) run --rm app sh -c 'npx supabase db diff --db-url "$$POSTGRES_URL_NON_POOLING"'

db-migrate: ## Scaffold a new migration file: make db-migrate name=your_migration_name
	@test -n "$(name)" || (echo "Usage: make db-migrate name=your_migration_name" && exit 1)
	$(COMPOSE) run --rm app npx supabase migration new $(name)

db-pull: ## Pull remote schema changes into a new local migration
	$(COMPOSE) run --rm app sh -c 'npx supabase db pull --db-url "$$POSTGRES_URL_NON_POOLING"'

db-reset-local: ## Wipe and re-apply all migrations on local Postgres (destructive)
	$(COMPOSE) run --rm db psql -U postgres -c "DROP DATABASE IF EXISTS aichitect; CREATE DATABASE aichitect;"
	$(MAKE) db-push-local
