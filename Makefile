.PHONY: help install install-frontend install-backend dev build build-frontend build-backend test test-frontend test-backend lint lint-frontend lint-backend format format-frontend format-backend clean

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
	@echo ""

## Install all dependencies
install: install-frontend install-backend

install-frontend:
	cd apps/frontend && pnpm install

install-backend:
	cd apps/backend && ./gradlew dependencies --quiet

## Start the full stack: Ktor backend (Testcontainers PostgreSQL) + Astro frontend
dev: install
	@(cd apps/backend && USE_TESTCONTAINERS=true ./gradlew run) & backend=$$!; \
	(cd apps/frontend && BACKEND_URL=http://localhost:8080 pnpm dev) & frontend=$$!; \
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
