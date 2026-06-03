# Fagprøve Frontend

Astro SSR-app for fagprøve-monorepo-malen. Bruker React 19 og Nav Aksel designsystem for UI, med Nav-dekoratøren integrert via SSR.

## Stack

- **Astro 6** (SSR, Node-adapter) — sideramme
- **React 19** — interaktive komponenter
- **@navikt/ds-react** — Nav Aksel designsystem
- **@navikt/nav-dekoratoren-moduler** — Nav-header og footer
- **MSW** — API-mocking i tester
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

Browserkode skal kalle samme-origin `/api/*`-ruter. Astro-serveren bruker `BACKEND_URL` for å kalle backend internt.

## BFF-ruter

| Rute               | Backend-kall   | Bruk           |
| ------------------ | -------------- | -------------- |
| `GET /api/hello`   | `GET /hello`   | Demo-hilsen    |
| `GET /api/cities`  | `GET /cities`  | Hent byer      |
| `POST /api/cities` | `POST /cities` | Opprett by     |
| `GET /api/users`   | `GET /users`   | Hent brukere   |
| `POST /api/users`  | `POST /users`  | Opprett bruker |

## Prosjektstruktur

```
src/
├── api/          # Generert OpenAPI-klient og schema-typer
├── components/   # React-komponenter (CityForm, UserForm, o.l.)
├── layouts/      # BaseLayout med Nav-dekoratør
├── lib/          # Backend-klient og hjelpefunksjoner
├── mocks/        # MSW-handlere for API-mocking i tester
└── pages/        # Astro-sider og API-ruter
```
