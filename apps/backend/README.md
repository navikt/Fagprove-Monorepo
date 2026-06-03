# Fagprøve Backend

Ktor-backend for fagprøve-monorepo-malen. Tilbyr et REST API med PostgreSQL via Exposed ORM, Flyway-migrasjoner og strukturert JSON-logging.

## Stack

- **Ktor** (Netty) — HTTP-server
- **Exposed v1** — ORM (DSL-stil, ikke DAO)
- **Flyway** — databasemigrasjoner
- **PostgreSQL** — produksjonsdatabase (Testcontainers lokalt)
- **H2** — in-memory database for tester
- **kotlinx.serialization** — JSON
- **Micrometer / Prometheus** — metrikker

## Kom i gang

```bash
# Fra rotmappen i monorepoet:
make dev          # Starter backend + frontend med Testcontainers PG

# Eller kun backend:
cd apps/backend
USE_TESTCONTAINERS=true ./gradlew run
```

Serveren starter på `http://localhost:8080`.

## API-endepunkter

| Metode | Sti            | Beskrivelse              |
|--------|----------------|--------------------------|
| GET    | `/`            | Helsesjekk               |
| GET    | `/hello`       | JSON-hilsen til frontend |
| GET    | `/isalive`     | Liveness probe           |
| GET    | `/isready`     | Readiness probe          |
| GET    | `/internal/isalive` | Intern liveness probe |
| GET    | `/internal/isready` | Intern readiness probe |
| GET    | `/internal/metrics` | Prometheus-metrikker |
| GET    | `/openapi`     | Swagger UI               |

## Bygg og test

```bash
./gradlew test          # Kjør tester (H2 in-memory, ingen Docker)
./gradlew buildFatJar   # Bygg fat-jar
./gradlew ktlintCheck   # Lint
./gradlew ktlintFormat  # Auto-formater
```

## Docker

```bash
./gradlew buildFatJar
docker build -t fagprove-backend .
docker run -p 8080:8080 fagprove-backend
```

## Miljøvariabler

Se [`.env.example`](../../.env.example) i rotmappen for alle tilgjengelige variabler.

I Nais er backend intern og nås fra frontend via `BACKEND_URL`. Staging og prod bruker Cloud SQL-variabler med `envVarPrefix: DB`.

Ved lokal Testcontainers- eller H2-oppstart seedes fem deterministiske testsøknader automatisk. Sett `SEED_TEST_SOKNADER=false` for å skru dette av. Eksterne databaser seedes ikke, og `SEED_TEST_SOKNADER=true` avvises for å unngå testdata i prod-lignende miljøer.
