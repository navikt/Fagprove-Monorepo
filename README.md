# Fagprøve Monorepo Template

Fullstack-mal for fagprøve med Astro/React-frontend, Ktor-backend og Nais-deploy.

## Kom i gang

```bash
make install
make dev
```

Frontend starter på `http://localhost:4321`, og backend starter på `http://localhost:8080`.

## Prosjektstruktur

```text
apps/
  frontend/   Astro SSR, React 19, TypeScript og Aksel
  backend/    Ktor, Kotlin på JVM 21, Exposed, Flyway og PostgreSQL
docs/         Deploy- og arkitekturdokumentasjon
```

## Kommandoer

| Kommando             | Beskrivelse                                    |
| -------------------- | ---------------------------------------------- |
| `make install`       | Installerer frontend- og backend-avhengigheter |
| `make dev`           | Starter hele stacken lokalt                    |
| `make build`         | Bygger frontend og backend                     |
| `make test`          | Kjører alle tester                             |
| `make test-frontend` | Kjører Vitest for frontend                     |
| `make test-backend`  | Kjører JUnit for backend                       |
| `make clean`         | Sletter bygde artefakter                       |

## Arkitektur

Frontend er en Astro SSR-app med React-komponenter og Nav Aksel. Nettleseren kaller kun samme-origin `/api/*`-ruter i Astro. Disse rutene fungerer som BFF og kaller backend via `BACKEND_URL`.

Backend er en Ktor-applikasjon med REST-endepunkter for `cities` og `users`. I Nais er backend intern og tilgjengelig fra frontend gjennom `accessPolicy`. Staging og prod bruker Cloud SQL med `envVarPrefix: DB`.

Les [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for systemkontekst, beslutningskart og regler for nye ADR-er. Les [`docs/adr-technology-decisions.md`](docs/adr-technology-decisions.md) for detaljerte teknologivalg.

## Miljøvariabler

Se [`.env.example`](.env.example) for lokal kjøring og Nais-variabler. De viktigste er:

| Variabel             | Brukes av | Beskrivelse                                    |
| -------------------- | --------- | ---------------------------------------------- |
| `BACKEND_URL`        | Frontend  | Intern URL til backend fra Astro-serveren      |
| `USE_TESTCONTAINERS` | Backend   | Starter lokal PostgreSQL med Docker når `true` |
| `POSTGRES_URL`       | Backend   | JDBC-URL til ekstern lokal database            |
| `DB_*`               | Backend   | Cloud SQL-variabler fra Nais                   |

## Deploy

Se [`docs/DEPLOY.md`](docs/DEPLOY.md) for Nais-oppsett, PR-miljø, staging/prod og sjekkpunkter før fagprøve.

## Videre lesing

- [`apps/frontend/README.md`](apps/frontend/README.md)
- [`apps/backend/README.md`](apps/backend/README.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/adr-technology-decisions.md`](docs/adr-technology-decisions.md)
