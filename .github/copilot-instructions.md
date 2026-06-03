# Copilot Instructions

This is a **full-stack monorepo** used as a Fagprøve template at Nav.

---

## Stack

| Layer     | Technology                                             |
|-----------|--------------------------------------------------------|
| Frontend  | Astro 6 + React 19 + TypeScript, Nav Aksel design system (`@navikt/ds-react`) |
| Backend   | Ktor (Kotlin, JVM 21) + Exposed ORM + PostgreSQL       |
| Dev DB    | Testcontainers (PostgreSQL via Docker, `USE_TESTCONTAINERS=true`) |
| Test DB   | H2 in-memory                                           |
| Tests     | Vitest (frontend unit) · Playwright (e2e) · JUnit (backend) |
| Package manager | pnpm (frontend)                                 |
| Build     | Gradle (backend) · Astro CLI (frontend)                |

---

## Repository layout

```
apps/
  frontend/   # Astro SSR app, pnpm
  backend/    # Ktor fat-jar app, Gradle
Makefile      # Unified dev commands (see below)
```

---

## Key commands

```bash
make install          # Install all dependencies
make dev              # Start full stack (Testcontainers PG + Astro HMR)
make build            # Build frontend + backend
make test             # Run all tests
make test-frontend    # Vitest unit tests
make test-backend     # JUnit tests (H2 in-memory)
make clean            # Remove build artifacts
```

Frontend-only:
```bash
cd apps/frontend && pnpm test          # Vitest
cd apps/frontend && pnpm test:e2e      # Playwright
cd apps/frontend && pnpm dev           # Dev server
```

Backend-only:
```bash
cd apps/backend && ./gradlew run       # Start backend
cd apps/backend && ./gradlew test      # Run tests
cd apps/backend && ./gradlew buildFatJar  # Build fat jar
```

---

## Coding conventions

- **Frontend**: TypeScript strict mode. Use Nav Aksel components (`@navikt/ds-react`) for all UI — avoid raw HTML elements when an Aksel equivalent exists.
- **Backend**: Idiomatic Kotlin. Define routes in Ktor route DSL. Use Exposed DSL (not DAO pattern) for database access.
- **API**: OpenAPI/Swagger spec is served by the backend. Keep it up to date when adding/changing endpoints.
- **No secrets in source code.** Use environment variables or application config files.

---

## Testing approach

- Unit tests live next to source files (`*.test.ts` or `*.spec.ts` for frontend; `*Test.kt` for backend).
- E2E tests live in `apps/frontend/e2e/`.
- Backend tests use H2 in-memory — no Docker needed for `make test-backend`.
- Frontend tests use Vitest + happy-dom + MSW for API mocking.

---

## Environment variables

| Variable              | Default | Description                                   |
|-----------------------|---------|-----------------------------------------------|
| `USE_TESTCONTAINERS`  | `true`  | Spin up PostgreSQL via Docker for local dev   |
| `POSTGRES_URL`        | —       | Connect to an existing PostgreSQL instance     |

---

## PR & issue workflow

- Use the PR template (`.github/pull_request_template.md`). Fill every section.
- Reference the relevant GitHub issue in the PR summary.
- CI must pass (frontend + backend tests) before merging.
