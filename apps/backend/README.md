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

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| GET | `/` | Helsesjekk |
| GET | `/hello` | JSON-hilsen til frontend |
| GET | `/isalive` | Liveness probe |
| GET | `/isready` | Readiness probe som også sjekker database |
| GET | `/api/v1/foreldrepenger/soknader` | Digisis-testsøknader for demo/listing uten rått fødselsnummer |
| POST | `/api/v1/foreldrepenger/vedtak` | Starter behandling av valgt søknad og returnerer sak-id, status, regelspor og vedtak/manuell vurdering. Gjentatte kall for samme søknad returnerer eksisterende sak idempotent |
| GET | `/api/v1/foreldrepenger/saker/{id}` | Henter sak med søknadsdata, regelspor, status og vedtak/manuell vurdering. `{id}` er sak-/behandling-id fra `/vedtak` |
| GET | `/api/v1/foreldrepenger/saker/{id}/intern-merknad` | Henter intern merknad for en sak, eller tom standardtilstand hvis ingen merknad er lagret |
| PUT | `/api/v1/foreldrepenger/saker/{id}/intern-merknad` | Oppretter eller oppdaterer intern merknad for en sak, separat fra ordinære saks- og vedtaksdata |
| GET | `/api/v1/foreldrepenger/interne-merknader` | Viser saker markert for intern oppfølging for teamleder/avdelingsleder |
| POST | `/api/v1/foreldrepenger/saker/{id}/beslutning` | Lagrer manuell innvilgelse eller avslag for en sak som venter på manuell beslutning |
| GET | `/internal/isalive` | Intern liveness probe |
| GET | `/internal/isready` | Intern readiness probe som også sjekker database |
| GET | `/internal/metrics` | Prometheus-metrikker |
| GET | `/openapi` | Swagger UI |

Foreldrepenger-API-et er kun tilgjengelig under `/api/v1/foreldrepenger/*`. Når `IDPORTEN_ISSUER`, `IDPORTEN_JWKS_URI` og `IDPORTEN_AUDIENCE` er satt, krever foreldrepenger-API-et ID-porten JWT. Lokal utvikling uten IDPORTEN-konfigurasjon kjører fortsatt uten auth.

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

Backend synkroniserer foreldrepenger-testsøknader fra Digisis ved oppstart for Testcontainers og eksterne databaser. Kilden styres med `DIGISIS_SOKNAD_SOURCE_URL` og har default `https://api.digisis.org/api/foreldrepenger/soknader`. Synken er idempotent, mapper Digisis-id til deterministisk UUID og returnerer kun syntetisk søkerident i API-responser.

H2/in-memory oppstart bruker deterministiske lokale testsøknader som default for testbarhet. Sett `SYNC_EXTERNAL_SOKNADER=false` og `SEED_TEST_SOKNADER=true` for deterministisk lokal seed med Testcontainers. `SYNC_EXTERNAL_SOKNADER=true` kan ikke kombineres med `SEED_TEST_SOKNADER=true`, og `SEED_TEST_SOKNADER=true` avvises for eksterne databaser.
