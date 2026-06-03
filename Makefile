.PHONY: help install install-frontend install-backend check-dev-ports dev build build-frontend build-backend test test-frontend test-backend lint lint-frontend lint-backend format format-frontend format-backend clean

BACKEND_PORT ?= 8080
FRONTEND_PORT ?= 4321

# Default target
help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install           Install all dependencies (frontend + backend)"
	@echo "  install-frontend  Install frontend npm dependencies via pnpm"
	@echo "  install-backend   Download Gradle wrapper and resolve dependencies"
	@echo ""
	@echo "  dev               Start full stack in dev mode (Testcontainers PG + Astro HMR)"
	@echo ""
	@echo "  build             Build all apps"
	@echo "  build-frontend    Build Astro frontend"
	@echo "  build-backend     Build Ktor backend fat jar"
	@echo ""
	@echo "  test              Run all tests"
	@echo "  test-frontend     Run frontend unit tests (Vitest)"
	@echo "  test-backend      Run backend unit tests (H2 in-memory)"
	@echo ""
	@echo "  lint              Lint all code (ESLint + Ktlint)"
	@echo "  lint-frontend     ESLint + Prettier check"
	@echo "  lint-backend      Ktlint check"
	@echo ""
	@echo "  format            Auto-format all code"
	@echo "  format-frontend   ESLint fix + Prettier write"
	@echo "  format-backend    Ktlint format"
	@echo ""
	@echo "  clean             Remove all build artifacts"
	@echo ""
	@echo "Environment variables for 'dev':"
	@echo "  USE_TESTCONTAINERS=true   (default) Spin up PostgreSQL via Docker"
	@echo "  POSTGRES_URL=jdbc:postgresql://...   Connect to an existing PostgreSQL instance"
	@echo "  BACKEND_PORT=8080         Ktor backend port (example: make dev BACKEND_PORT=8081)"
	@echo "  FRONTEND_PORT=4321        Astro frontend port (example: make dev FRONTEND_PORT=4322)"
	@echo ""

## Install all dependencies
install: install-frontend install-backend

install-frontend:
	cd apps/frontend && pnpm install

install-backend:
	cd apps/backend && ./gradlew dependencies --quiet

check-dev-ports:
	@if [ "$(BACKEND_PORT)" = "$(FRONTEND_PORT)" ]; then \
		echo "BACKEND_PORT and FRONTEND_PORT must be different (both are $(BACKEND_PORT))."; \
		echo "Try: make dev BACKEND_PORT=8081"; \
		exit 1; \
	fi; \
	check_port() { \
		port="$$1"; \
		if command -v lsof >/dev/null 2>&1; then \
			lsof -nP -iTCP:$$port -sTCP:LISTEN >/dev/null 2>&1; \
		elif command -v ss >/dev/null 2>&1; then \
			ss -H -ltn "sport = :$$port" 2>/dev/null | grep -q .; \
		else \
			return 1; \
		fi; \
	}; \
	if ! command -v lsof >/dev/null 2>&1 && ! command -v ss >/dev/null 2>&1; then \
		echo "Skipping dev port preflight check: install lsof or ss to enable it."; \
		exit 0; \
	fi; \
	for spec in "backend:$(BACKEND_PORT)" "frontend:$(FRONTEND_PORT)"; do \
		name=$${spec%%:*}; \
		port=$${spec#*:}; \
		case "$$port" in \
			""|*[!0-9]*) echo "$${name} port must be numeric, got '$$port'."; exit 1 ;; \
		esac; \
		if check_port "$$port"; then \
			echo "Port $$port ($$name) is already in use."; \
			echo "Stop the process using it or run: make dev BACKEND_PORT=8081 FRONTEND_PORT=4322"; \
			exit 1; \
		fi; \
	done

## Start the full stack: Ktor backend (Testcontainers PostgreSQL) + Astro frontend
dev: check-dev-ports install
	@echo "Starting backend on http://localhost:$(BACKEND_PORT) and frontend on http://localhost:$(FRONTEND_PORT)"
	@(cd apps/backend && BACKEND_PORT=$(BACKEND_PORT) USE_TESTCONTAINERS=true ./gradlew run) & backend=$$!; \
	(cd apps/frontend && BACKEND_URL=http://localhost:$(BACKEND_PORT) pnpm dev --port $(FRONTEND_PORT)) & frontend=$$!; \
	trap 'kill $$backend $$frontend 2>/dev/null; exit 0' INT TERM EXIT; \
	wait $$backend $$frontend

## Build everything
build: build-frontend build-backend

build-frontend:
	cd apps/frontend && pnpm build

build-backend:
	cd apps/backend && ./gradlew buildFatJar

## Run all tests
test: test-frontend test-backend

test-frontend:
	cd apps/frontend && pnpm test

test-backend:
	cd apps/backend && ./gradlew test

## Remove build artifacts
clean:
	cd apps/backend && ./gradlew clean
	rm -rf apps/frontend/dist apps/frontend/.astro

## Lint all code
lint: lint-frontend lint-backend

lint-frontend:
	cd apps/frontend && pnpm lint && pnpm format:check

lint-backend:
	cd apps/backend && ./gradlew ktlintCheck

## Format all code
format: format-frontend format-backend

format-frontend:
	cd apps/frontend && pnpm lint:fix && pnpm format

format-backend:
	cd apps/backend && ./gradlew ktlintFormat
