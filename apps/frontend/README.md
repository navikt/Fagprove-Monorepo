# Fagprøve Frontend

Astro SSR-app for foreldrepenger-saksbehandling. Bruker React 19 og Nav Aksel designsystem for en intern saksbehandlerflate.

## Stack

- **Astro 6** (SSR, Node-adapter) — sideramme
- **React 19** — interaktive komponenter
- **@navikt/ds-react** — Nav Aksel designsystem
- **MSW** — API-mocking ved behov i tester og lokal demo
- **Vitest + @testing-library/react** — enhetstester
- **Playwright** — end-to-end-tester

## Kom i gang

```bash
# Fra rotmappen i monorepoet:
make dev    # Starter backend + frontend

# Eller kun frontend:
cd apps/frontend
BACKEND_URL=http://localhost:8080 pnpm dev
```

Appen starter på `http://localhost:4321`.

## Kommandoer

```bash
pnpm dev            # Utviklingsserver med HMR
pnpm build          # Produksjonsbygg til ./dist/
pnpm preview        # Forhåndsvisning av produksjonsbygg
pnpm test           # Vitest enhetstester
pnpm test:e2e       # Playwright e2e-tester
pnpm lint           # ESLint
pnpm lint:fix       # ESLint med autofix
pnpm format         # Prettier
pnpm format:check   # Prettier-sjekk
```

## Miljøvariabler

Se [`.env.example`](../../.env.example) i rotmappen for alle tilgjengelige variabler.

Browserkode skal kalle samme-origin `/api/*`-ruter når frontend trenger BFF-endepunkter. Astro-serveren bruker `BACKEND_URL` for å kalle backend internt. Backendens foreldrepenger-API ligger under `/api/v1/foreldrepenger/*`.

## UI-struktur

Forsiden bruker Aksel `InternalHeader`, en sentrert hovedcontainer og gjenbrukbare seksjonskort. `Velg søknad` henter arbeidslisten via samme-origin `/api/v1/foreldrepenger/soknader`, og `Åpne sak` starter behandling via `/api/v1/foreldrepenger/vedtak`.

## Prosjektstruktur

```
src/
├── components/   # React-komponenter og gjenbrukbar layout
├── layouts/      # BaseLayout med intern saksbehandlershell
├── lib/          # Backend-klient og hjelpefunksjoner
├── mocks/        # MSW-handlere for API-mocking ved behov
└── pages/        # Astro-sider og API-ruter
```
