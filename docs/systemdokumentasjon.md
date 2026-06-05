# Systemdokumentasjon

## Formål

Dette prosjektet er en fagprøve-løsning for foreldrepenger. Systemet er laget som en intern saksbehandlerflate der en saksbehandler kan se søknader, starte behandling, se regelspor, se vedtak og behandle saker som må vurderes manuelt.

Målet er å vise en helhetlig fullstack-løsning med frontend, backend, database, API, regelmotor, tester og dokumentasjon.

## Teknologistack

| Del | Teknologi | Bruk |
|---|---|---|
| Frontend | Astro, React, TypeScript og Aksel | Intern saksbehandlerflate |
| Backend | Kotlin og Ktor | REST API, regelmotor og saksbehandling |
| Database | PostgreSQL, Exposed og Flyway | Lagring av søknader, behandlinger, regelspor og vedtak |
| Tester frontend | Vitest, Testing Library og Playwright | Komponenttester og ende-til-ende-tester |
| Tester backend | JUnit/Kotlin test og H2/Testcontainers | Domene-, repository- og rutetester |
| Drift | Docker og Nais-oppsett | Bygg og deploy av frontend og backend |

## Overordnet arkitektur

Frontend er en Astro SSR-app med React-komponenter og Nav Aksel. Nettleseren kaller samme-origin `/api/*`-ruter i Astro. Astro-serveren bruker `BACKEND_URL` for å kalle backend internt.

Backend er en Ktor-applikasjon. Den eksponerer API-er under `/api/v1/foreldrepenger/*`, kjører regelmotoren og lagrer data i databasen.

Databasen brukes til å lagre:

- søknader
- inntektshistorikk
- behandlinger
- regelresultater
- vedtak
- interne merknader for oppfølging

## Viktige brukerflyter

### 1. Saksbehandler velger søknad

Frontend viser en arbeidsliste med søknader. Saksbehandler kan åpne en søknad for å starte eller fortsette behandling.

### 2. Backend starter behandling

Når en søknad åpnes, sender frontend en forespørsel til backend. Backend kjører søknaden gjennom regelmotoren.

### 3. Regelmotoren vurderer saken

Regelmotoren vurderer blant annet:

- opptjening
- beregningsgrunnlag
- stønadsperiode
- kvotefordeling
- om saken må til manuell vurdering

Resultatet lagres som regelspor, slik at saksbehandler kan se hvorfor systemet kom frem til resultatet.

### 4. Vedtak eller manuell vurdering

Hvis reglene kan avgjøre saken automatisk, lagres vedtaket direkte. Hvis saken krever manuell vurdering, vises dette tydelig i frontend. Saksbehandler kan da fatte manuell beslutning med begrunnelse.

### 5. Intern oppfølging

Saker kan markeres for intern oppfølging dersom de er kompliserte eller krever ekstra kvalitetssikring. Intern merknad holdes adskilt fra ordinær saksdata.

## API-oversikt

| Metode | Path | Beskrivelse |
|---|---|---|
| GET | `/api/v1/foreldrepenger/soknader` | Henter søknader til arbeidslisten |
| POST | `/api/v1/foreldrepenger/vedtak` | Starter behandling av en søknad |
| GET | `/api/v1/foreldrepenger/saker/{id}` | Henter sak med saksdata, regelspor og vedtak |
| POST | `/api/v1/foreldrepenger/saker/{id}/beslutning` | Lagrer manuell beslutning |
| GET | `/api/v1/foreldrepenger/saker/{id}/intern-merknad` | Henter intern merknad for sak |
| PUT | `/api/v1/foreldrepenger/saker/{id}/intern-merknad` | Oppretter eller oppdaterer intern merknad |
| GET | `/api/v1/foreldrepenger/interne-merknader` | Henter saker med intern oppfølging |
| POST | `/api/v1/foreldrepenger/demo/reset` | Nullstiller demodata når demo-reset er aktivert |
| GET | `/internal/isalive` | Intern liveness-probe |
| GET | `/internal/isready` | Intern readiness-probe |
| GET | `/internal/metrics` | Prometheus-metrikker |
| GET | `/openapi` | Swagger UI / OpenAPI-dokumentasjon |

Foreldrepenger-API-et er samlet under `/api/v1/foreldrepenger/*`. Når ID-porten-konfigurasjon er satt, krever API-et gyldig token. Lokal utvikling med testdata kan kjøres uten auth.

## Frontend

Frontend ligger i `apps/frontend`.

Viktige deler:

- `src/pages` inneholder Astro-sider og API-ruter.
- `src/components` inneholder React-komponenter for arbeidsliste, saksvisning, regelspor, vedtak og intern oppfølging.
- `src/lib` inneholder backend-klient, typer og formattering.
- `src/mocks` inneholder MSW-data for tester og lokal demo.
- `e2e` inneholder Playwright-tester.

Frontend skal ikke regne ut fagreglene selv. Den skal vise resultatet fra backend og sende brukerhandlinger som å åpne sak, lagre intern merknad og fatte manuell beslutning.

## Backend

Backend ligger i `apps/backend`.

Viktige deler:

- `domain` inneholder domenemodell og regelmotor.
- `application` inneholder applikasjonstjenester.
- `routes` inneholder HTTP-ruter.
- `dto` inneholder API-kontrakter.
- `repository` inneholder database- og mapperlogikk.
- `db/migration` inneholder Flyway-migrasjoner.
- `src/test` inneholder tester for domene, repository, ruter, config og plugins.

Backend eier regelmotoren og er kilden til regelresultat, vedtak og manuell vurdering.

## Kom i gang

Fra repo-roten:

```bash
make install
make dev
```

Frontend starter på `http://localhost:4321`, og backend starter på `http://localhost:8080`.

## Viktige kommandoer

| Kommando | Beskrivelse |
|---|---|
| `make install` | Installerer frontend- og backend-avhengigheter |
| `make dev` | Starter frontend og backend lokalt |
| `make build` | Bygger frontend og backend |
| `make test` | Kjører alle tester |
| `make test-frontend` | Kjører frontendtester |
| `make test-backend` | Kjører backendtester |
| `make clean` | Sletter bygde artifacts |

Frontend-spesifikke kommandoer kjøres i `apps/frontend`, for eksempel `pnpm test`, `pnpm test:e2e` og `pnpm lint`.

Backend-spesifikke kommandoer kjøres i `apps/backend`, for eksempel `./gradlew test`, `./gradlew buildFatJar` og `./gradlew ktlintCheck`.

## Miljøvariabler

Se [`.env.example`](../.env.example) for lokal kjøring og Nais-variabler.

De viktigste variablene er:

| Variabel | Brukes av | Beskrivelse |
|---|---|---|
| `BACKEND_URL` | Frontend | Intern URL til backend fra Astro-serveren |
| `USE_TESTCONTAINERS` | Backend | Starter lokal PostgreSQL med Docker når `true` |
| `POSTGRES_URL` | Backend | JDBC-URL til ekstern lokal database |
| `DB_*` | Backend | Cloud SQL-variabler fra Nais |
| `IDPORTEN_*` | Backend | Aktiverer ID-porten-validering når satt |
| `DEMO_RESET_ENABLED` | Backend | Styrer om demo-reset-endepunktet er tilgjengelig |

## Personvern og sikkerhet

Løsningen bruker testdata, men dataene ligner reelle saksdata. Derfor er det gjort vurderinger rundt personvern, logging, dataminimering og tilgangskontroll.

Viktige prinsipper:

- Frontend får bare data den trenger.
- Fødselsnummer skal ikke logges unødvendig.
- Regelmotoren ligger i backend.
- Manuelle beslutninger lagres med begrunnelse og tidspunkt.
- Interne merknader holdes adskilt fra ordinær saksdata.
- Secrets skal ikke ligge i kildekoden.

Se også:

- [ROS-vurdering](./risikovurdering.md)
- [PVK / personvernsvurdering](./personvernsvurdering.md)
