COMPOSE = docker compose

.PHONY: help run down restart build rebuild logs shell typecheck lint format check test

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
