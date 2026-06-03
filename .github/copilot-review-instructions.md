# Copilot Code Review Instructions

Custom review rules for the Fagprøve monorepo (`apps/frontend` + `apps/backend`).
Flag for human reviewer — do not block.

## Review bar

- Review as if the PR will be used in a fagprøve next week: correctness, clarity, and deployability matter more than speed.
- Focus on high-confidence issues only. Do not comment on style, naming, formatting, or personal preference unless it can cause a real bug, security issue, failed deploy, or confusing fagprøve handoff.
- Check changed code and directly coupled surfaces: tests, API contracts, Nais manifests, GitHub Actions, docs, and frontend/backend call paths.
- Every comment must explain the concrete risk and point to a fix. Avoid vague comments like "consider improving this".
- If the same issue appears in several files, leave one representative comment and mention the other affected files.
- Flag missing tests when the PR changes behavior, validation, error handling, deploy logic, auth, or data persistence.
- Flag mismatches between validation, normalization, persistence, and displayed user feedback. The value we validate must match the value we submit or store.
- Flag stale code paths, unused clients, dead config, and dependencies that are not used by production or tests.

## Red-zone review

Always inspect these changes more strictly:

- Auth, authorization, token handling, CORS, or Nais `accessPolicy`
- GitHub Actions, reusable workflows, permissions, secrets, deploy order, and Nais manifests
- Input validation, request normalization, data model, database migrations, and error handling
- BFF/API contracts between browser, Astro routes, backend routes, and OpenAPI docs
- Raw HTML, CSP, external scripts, or `dangerouslySetInnerHTML`

For red-zone changes, flag if the PR lacks a clear test, checklist update, or explanation.

## Security (all code)

- SQL must use parameterized queries (prepared statements / Exposed DSL) — never string concatenation
- No hardcoded secrets, tokens, passwords, or API keys
- No PII (fødselsnummer, name, address) in log statements — use opaque IDs
- No `.env` files committed (must be in `.gitignore`)
- Sanitize error responses: log full detail server-side, return generic messages to clients
- `dangerouslySetInnerHTML` is only allowed behind a named trusted boundary for first-party HTML. Never pass user-provided content to it.

## GitHub Actions and deploy

- External actions and reusable workflows must be pinned to full commit SHAs. Major tags, branch names, and `@main` are not acceptable.
- Permissions must be explicit and minimal per job. Flag broad write permissions unless the job needs them.
- Every deploy or long-running job needs `timeout-minutes`.
- Flag `pull_request_target`, untrusted PR checkout, or shell execution of PR-controlled input.
- Nais Application fields must match the current spec. Flag unknown fields, undocumented annotations, and TTL/cleanup changes that are not documented.
- PR preview workflows must shut down or expire preview apps on PR close/merge.

## Kotlin/Ktor (`apps/backend/**/*.kt`)

- **Database access:** Use Exposed DSL (`transaction {}`, `Table`, `select`, `insert`, `update`) — not JPA, Hibernate, or raw JDBC
- **Exposed DSL:** If using Exposed, prefer DSL style — not DAO pattern
- **Null safety:** No `!!` operator without a preceding null check or meaningful comment explaining why it cannot be null
- **HTTP status codes:** Routes must return correct status codes (201 for create, 404 for not found, 400 for bad request)
- **Auth:** New or modified endpoints must be inside `authenticate(...)` block unless they are health/metrics endpoints
- **Logging:** Use `KotlinLogging.logger {}` — not `println` or `System.out`
- **Coroutines in transactions:** No `launch`, `async`, or suspend calls inside a `transaction {}` block (ThreadLocal does not propagate) — use `suspendTransaction {}` if suspension is needed
- **Resource cleanup:** Always close database connections — prefer Exposed's `transaction {}` scope which manages this automatically
- **Route parity:** Backend routes, Astro BFF routes, frontend calls, and OpenAPI docs must agree on path, method, status codes, and error shape.
- **Validation:** Validate server-side even when the frontend validates. Error messages must not expose stack traces, SQL details, tokens, or PII.

## Flyway migrations (`apps/backend/src/main/resources/db/migration/**`)

- Naming: `V{n}__{description}.sql` — double underscore, sequential version numbers
- **Never modify existing migration files** — always add a new migration
- Include indexes for all foreign key columns
- Destructive changes (DROP TABLE, DROP COLUMN) require explicit justification

## TypeScript/React/Astro (`apps/frontend/**/*.{ts,tsx,astro}`)

- **UI components:** Use Aksel components (`@navikt/ds-react`) — not raw `<div>`/`<button>` when an Aksel equivalent exists
- **Spacing:** Use Aksel spacing props (`Box paddingBlock="space-16"`, `VStack gap="space-8"`) — not Tailwind `p-*`/`m-*` for component-level spacing
- **BFF boundary:** Browser code must call same-origin `/api/*`. Backend service URLs belong only in server-side Astro code.
- **Form handling:** Normalize once before validation and submission. Do not validate raw input and submit a different normalized value.
- **Accessibility:**
  - No `<div onClick>` without `role="button"` and `tabIndex={0}`
  - Icon buttons need an accessible name (`title` or sr-only text)
  - Heading levels must not skip (`h1 → h2 → h3`, not `h1 → h3`)
  - `<img>` must have meaningful `alt` text, or `alt=""` if decorative
- **TypeScript:** No `any` — use proper types or `unknown` with type narrowing
- **Dependencies:** Flag imports from packages that are not declared in `package.json`, and dependencies that are declared but unused.
- **Error boundaries:** API calls must handle loading and error states — no unhandled promise rejections in components
- **Aksel tokens:** Spacing values must use valid `space-*` tokens, including two-value props such as `marginBlock`.

## Test quality

- Test files removed or assertions deleted — flag
- `@Disabled`, `skipTests`, `skip()` added without explanation — flag
- New features or bug fixes without a corresponding test — flag
- Tests that mock the thing under test (testing the mock, not the code) — flag
- Tests should cover at least one failure path for changed API routes, BFF routes, validation, and deploy workflow behavior.
- Regression fixes should include a test that would have failed before the fix.

## Norwegian text (`.md` files)

Flag in Norwegian markdown:

- **AI markers:** "banebrytende", "revolusjonerende", "sømløs", "holistisk", "det er verdt å merke seg", "la oss dykke ned i"
- **Passive form:** "det benyttes" → "vi bruker"
- **Anglismer:** "adressere et problem" → "løse"
- **Nav** skrives alltid "Nav", aldri "NAV"
- **Ikke oversett:** deploy, pipeline, endpoint, token, pull request, commit, branch — do not translate these

## Over-editing

Flag when the diff is disproportionate to the stated goal:

- Renamed variables, functions, or parameters unrelated to the fix
- Restructured or reformatted working code without justification
- Added validation, error handling, or refactoring outside the PR scope
