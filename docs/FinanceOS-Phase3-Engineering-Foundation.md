# FinanceOS MVP — Phase 3: Repository Structure & Engineering Foundation

**Status:** Proposed engineering baseline  
**Scope:** Repository, tooling, conventions, and operational foundations only. No finance feature or business logic is specified here.

## 1. Monorepo design

Use a single Git repository. FinanceOS has one product, a closely coupled web/API contract, and one small engineering team; a monorepo makes atomic cross-service changes, shared standards, and local development simpler. Package boundaries are explicit so services can be separated later without a repository rewrite.

```text
finance-os/
├── apps/
│   ├── frontend/                 # React/Vite web application
│   └── backend/                  # FastAPI application and workers
├── packages/
│   ├── api-contract/             # Generated/versioned API client and OpenAPI artifacts
│   ├── ui/                       # Optional shared presentational primitives
│   ├── config/                   # Shared non-secret lint/build configuration
│   └── test-fixtures/            # Non-production contract fixtures
├── docs/
│   ├── adr/                      # Architecture decision records
│   ├── architecture/             # Approved system and database designs
│   ├── standards/                # API, security, code, and testing standards
│   └── runbooks/                 # Operational and incident procedures
├── infrastructure/
│   ├── terraform/                # Future cloud infrastructure modules
│   └── ecs/                      # Future ECS task/service definitions
├── docker/                       # Shared container configurations and scripts
├── scripts/                      # Safe developer and CI automation
├── .github/
│   ├── workflows/                # CI workflows
│   └── pull_request_template.md
├── compose.yaml                  # Local development topology
├── .editorconfig
├── .gitignore
├── .pre-commit-config.yaml       # Optional Python-side local hooks
├── CODEOWNERS
├── CONTRIBUTING.md
├── README.md
└── Makefile / justfile            # Consistent cross-platform task aliases
```

`apps` prevents deployment concerns from leaking into reusable packages. `packages` begins small: it should not be created merely to share a type or helper. `docs` is first-class because the Phase 1/2 decisions are implementation constraints. `infrastructure` is declarative cloud configuration rather than a collection of deployment commands. Keep generated files out of source control except versioned OpenAPI snapshots when they are used for contract review.

## 2. Backend project structure and dependency direction

```text
apps/backend/
├── app/
│   ├── api/                      # Route modules and request/response adapters
│   │   └── v1/
│   ├── core/                     # Settings, logging, exceptions, security policies
│   ├── db/                       # Engine, session factory, migration integration
│   ├── dependencies/             # FastAPI dependency providers
│   ├── domain/                   # Business entities, value objects, domain errors
│   ├── models/                   # SQLAlchemy persistence mappings only
│   ├── repositories/             # Tenant-aware persistence operations
│   ├── schemas/                  # Pydantic boundary schemas
│   ├── services/                 # Use-case orchestration and transactions
│   ├── workers/                  # Background job entry points and task definitions
│   ├── middleware/               # Request ID, security headers, timing
│   ├── utils/                    # Narrow, dependency-light helpers
│   └── main.py                   # Application factory and lifecycle composition
├── alembic/                      # Migration environment and revisions
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── api/
│   └── fixtures/
├── pyproject.toml
├── poetry.lock
└── Dockerfile
```

Dependencies flow inward: **API → schemas/services → domain/repositories → models/db**. `core` is imported by outer layers only; domain entities never import FastAPI, SQLAlchemy, Redis, or environment settings. Repositories return domain-friendly objects rather than HTTP schemas. Services own transaction boundaries and may call repositories and external gateways. API handlers only authenticate, validate, invoke one use case, and map known exceptions to responses.

Avoid circular imports by keeping type-only imports behind `TYPE_CHECKING`, avoiding global service instances, and constructing dependencies through providers in `dependencies`. A worker invokes the same service use cases as the HTTP API; it does not import API modules.

## 3. Frontend structure

```text
apps/frontend/
├── src/
│   ├── app/                      # Application providers, router, bootstrap
│   ├── pages/                    # Route-level composition only
│   ├── layouts/                  # Authenticated and public shells
│   ├── features/                 # Feature-first modules
│   │   └── <feature>/
│   │       ├── api/              # Feature API calls/query options
│   │       ├── components/       # Feature-specific UI
│   │       ├── hooks/            # Feature behavior
│   │       ├── schemas/          # Form validation schemas
│   │       └── types.ts
│   ├── components/               # Reusable, product-agnostic components
│   │   └── ui/                   # shadcn/ui primitives and local wrappers
│   ├── services/                 # API client, authentication adapter
│   ├── hooks/                    # Cross-feature hooks
│   ├── contexts/                 # Small stable UI contexts only
│   ├── lib/                      # Formatting, query client, utilities
│   ├── types/                    # Global/shared client types
│   ├── assets/
│   ├── styles/
│   └── test/
├── public/
├── tests/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Use feature-first organization after a component is specific to a business capability; keep generic buttons, dialogs, tables, and empty states under `components`. Pages do not contain data-fetching or business rules. React Router owns route definitions and route-level lazy loading. TanStack Query owns remote server state; local component state owns ephemeral UI state; a small context is reserved for stable cross-cutting UI state such as theme. Do not introduce Redux/Zustand for MVP without a demonstrated client-state problem.

## 4. Shared packages and contracts

Do not share runtime Python/TypeScript business code. Instead, make the OpenAPI document the contract source of truth. The backend emits a versioned OpenAPI artifact; CI generates a typed TypeScript client into `packages/api-contract` and checks that regeneration has no unexpected diff. This prevents manually duplicated transport types.

`packages/ui` is optional and should exist only if a second frontend surface needs the same visual primitives. `packages/config` can hold ESLint, Prettier, TypeScript, and commit conventions. Constants and validation schemas remain in their owning application until a real multi-consumer need exists. Never place secrets or environment-specific runtime configuration in a shared package.

## 5. Environment and secrets strategy

| Environment | Purpose | Configuration source |
|---|---|---|
| local development | Developer workstation | Untracked `.env`; tracked `.env.example` documents every variable. |
| test | Isolated CI/local test runs | `.env.test` non-secret defaults plus CI-injected temporary credentials. |
| staging | Production-like validation | CI/CD secret store and cloud parameter/secrets service. |
| production | Customer traffic | Cloud secret manager, task-level identity, immutable deploy configuration. |

Frontend variables are limited to safe public values and use the Vite prefix. Backend uses Pydantic Settings with a typed, frozen configuration object loaded once at startup; validation fails immediately for missing/invalid variables. Required categories are application environment, database URL, Redis URL, Clerk verification configuration, allowed CORS origins, storage configuration, observability DSN, and feature flags. Secrets never appear in source, logs, browser bundles, test snapshots, issue tickets, or generated documentation.

Provide `.env.example` values that are syntactically valid but inert. Add secret scanning locally and in CI. Rotate credentials through the cloud secret manager; applications should receive a reference/identity rather than a hard-coded key when the platform supports it.

## 6. Docker strategy

Use one production Dockerfile per deployable app, with multi-stage builds and non-root runtime users. The backend image contains only its locked Python dependencies and application; the frontend image builds static assets and serves them through a minimal web server/CDN origin. PostgreSQL and Redis are only development/test compose services; production uses managed services.

`compose.yaml` defines `frontend`, `backend`, `postgres`, and `redis` on an internal network, exposing only browser/API development ports. Named volumes persist local PostgreSQL and Redis data. Bind mounts and watch mode are development-only to provide frontend and backend hot reload. A compose override may add local mail, object-storage emulation, or observability tooling, but these are opt-in profiles—not baseline dependencies.

Production containers are immutable, configured only by validated environment variables, health-checked, and do not run migrations automatically. A separate migration task runs once per deployment with a controlled database role. Do not add Kubernetes, service mesh, or a separate queue cluster in the MVP.

## 7. Dependency management

Use Poetry for Python: declare direct dependencies and version ranges in `pyproject.toml`, commit `poetry.lock`, and install exactly from the lock file in CI/images. Group development tooling separately. Use Node LTS, npm workspaces (or pnpm workspaces if chosen once), a root `package.json`, committed lockfile, and `npm ci` in CI. Pin tools that affect reproducibility; allow narrowly bounded compatible ranges only for direct dependencies.

Run a scheduled monthly dependency-update pull request and a security-alert workflow. Update one coherent dependency set at a time, run the full suite, and record material framework upgrades as ADRs. Never use floating `latest` versions in a committed application manifest.

## 8. Code standards

| Area | Standard |
|---|---|
| Naming | Python: `snake_case` modules/functions/variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants. TypeScript: `camelCase` values/functions, `PascalCase` React components/types, `kebab-case` directories, and `ComponentName.tsx` component files. |
| Database | Plural `snake_case` table names, singular model names, `_id` foreign keys, UTC timestamp suffixes (`_at`), money names ending `_amount`/`_balance`. |
| API | Resource-oriented plural paths, lowercase kebab-case URL segments, `/api/v1`, RFC 9457-style error bodies, cursor pagination for large lists. |
| Git | `codex/<type>/<short-description>` branches (or team equivalent), e.g. `feat/forecast-list`; squash merge after review. |
| Commits | Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`; concise imperative subject. |
| Formatting | Prettier/ESLint for TS; Ruff format + Ruff lint, Black-compatible style, and Mypy for Python. Editors use `.editorconfig`, LF, UTF-8, final newline. |
| Imports | Formatter/linter determines order; imports are absolute within an app; no wildcard imports. |
| Docstrings | Required for public modules, public services, and non-obvious domain decisions; do not narrate obvious code. Type signatures describe ordinary contracts. |
| Logging | Structured JSON logs only; include timestamp, level, service, environment, request ID, organization ID when authorized, and safe error code. Never log credentials, financial payloads, or raw PII. |
| Errors | Raise typed domain/infrastructure exceptions; map only at the API/worker boundary. Errors are actionable, stable, and safe for customers. No broad exception swallowing. |

Use pre-commit/Husky hooks for fast formatting, linting, type checks where practical, and secret scanning. `lint-staged` limits frontend hooks to changed files. CI remains authoritative because hooks can be bypassed.

## 9. Backend foundation

The backend is an application factory with explicit startup/shutdown lifecycle. Startup validates settings, initializes the database/Redis clients, configures structured logging, and exposes liveness/readiness state. No network-dependent business work occurs at import time.

Middleware order should establish request ID first, then trusted proxy handling, structured request logging/timing, CORS, security headers, rate-limit enforcement, and exception mapping. Accept an incoming request ID only after validating its format; otherwise generate one. Return it in every response and propagate it to jobs/outbound calls.

Provide `GET /health/live` (process is running) and `GET /health/ready` (required dependencies are reachable). Production readiness must check only dependencies needed to serve traffic. Central exception handling maps validation errors, authentication/authorization failures, known domain errors, and unexpected errors into a consistent public error envelope; unexpected exceptions are logged with the request ID and return a generic message.

Use FastAPI dependency injection for database sessions, authenticated membership, repositories, services, and rate-limit identity. Sessions are request/job scoped, committed by the service transaction boundary, and always closed. CORS uses an allow-list from settings; security headers include no-sniff, clickjacking prevention, restrictive referrer policy, and CSP suited to the frontend deployment. Rate limits begin at the edge for anonymous/auth endpoints and per-organization for expensive APIs, backed by Redis when horizontally scaled.

Background work is an explicit job interface: API code writes/queues a job after transaction success; a worker process consumes it with idempotency key, retry policy, correlation ID, dead-letter visibility, and status persistence. FastAPI `BackgroundTasks` is suitable only for trivial best-effort work and not for durable jobs.

## 10. Frontend foundation

Clerk handles session acquisition and renewal. The application uses a single authentication adapter; routes declare whether they are public, protected, or role-gated. A protected-route guard displays a consistent sign-in/unauthorized state and never relies on frontend checks for backend authorization.

The root provider stack is deliberately small: Clerk provider, theme provider, TanStack Query provider, router, error boundary, and toast provider. The authenticated layout owns sidebar/header/breadcrumbs; public layouts remain separate. Build responsive behavior mobile-first with semantic HTML, visible keyboard focus, and accessible labels.

Create a single API client that attaches the Clerk token, request ID, retry policy, typed error mapping, and base URL. Query keys and `queryOptions` live beside feature APIs. Cache server data with conservative defaults; invalidate from mutation success rather than manually synchronizing copies. Retry only idempotent/transient requests; never silently retry mutations that could duplicate financial actions. Route-level loading skeletons, empty states, and recoverable error boundaries are mandatory. Toasts confirm transient user actions; persistent errors have an actionable inline state.

## 11. CI/CD architecture

GitHub Actions runs on pull requests and protected-branch pushes. Reuse pinned action revisions, least-privilege `GITHUB_TOKEN` permissions, dependency caching keyed by lock files, and concurrency cancellation for superseded PR runs.

| Workflow stage | Required checks |
|---|---|
| Validate | Secret scan, dependency manifest validation, formatting, ESLint/Ruff, TypeScript/Mypy. |
| Test | Frontend unit/component tests; backend unit/API/repository tests; coverage artifact. |
| Integration | Ephemeral PostgreSQL/Redis services, migration upgrade from clean and previous release, API contract check. |
| Build | Production frontend build and backend image build; vulnerability scan; SBOM artifact when available. |
| Readiness | Verify Docker compose configuration, OpenAPI change review, and deployment configuration validation. |

For MVP, builds from the protected main branch may publish an immutable image tagged with commit SHA, but deployment is a manual, approved workflow. The deploy workflow performs a backup/compatibility check, runs the migration task, waits for readiness, and supports rollback to the prior application image only when migrations are backward compatible. Production changes require environment approval.

## 12. Testing strategy

Use a testing pyramid. Unit tests exercise pure domain/service behavior with fakes. Repository tests execute against disposable PostgreSQL because SQL semantics cannot be faithfully tested with SQLite. API tests use the FastAPI test client with dependency overrides only for external services. Integration tests run migrations and real PostgreSQL/Redis containers. Contract tests validate OpenAPI and generated client compatibility.

Frontend uses Vitest and React Testing Library for component behavior, accessibility roles, loading/error states, and feature hooks with mocked network boundaries. Avoid snapshot-heavy testing. MSW provides realistic API boundaries where appropriate. Future Playwright E2E coverage should start with authentication, a protected route, a key user workflow, authorization denial, and export/download—not every component.

```text
backend/tests/{unit,integration,api,fixtures}/
frontend/src/**/__tests__/
frontend/tests/{integration,fixtures}/
e2e/                              # added when Playwright is adopted
```

Set an initial coverage target of 80% for changed backend service/domain code and 70% for frontend feature logic, but never use aggregate coverage as a substitute for meaningful cases. Every bug fix gets a regression test. Financial and authorization paths require happy-path, invalid-input, tenant-boundary, and failure tests.

## 13. Documentation standards

| Document | Location and ownership |
|---|---|
| Product entry point and local setup | Root `README.md`; updated with every developer-affecting change. |
| Architecture / data model | `docs/architecture/`; approved design documents are versioned, not overwritten without an ADR. |
| Setup and developer workflow | `docs/standards/developer-guide.md`. |
| API and error conventions | `docs/standards/api-standards.md`; OpenAPI is the executable reference. |
| Coding/testing/security conventions | `docs/standards/`. |
| Contribution and review process | `CONTRIBUTING.md` and PR template. |
| Deployment/rollback/incident playbooks | `docs/runbooks/`. |
| Decisions | `docs/adr/NNNN-title.md`, immutable once accepted; supersede with a new ADR. |

ADRs contain context, decision, alternatives, consequences, and date/status. Keep setup documentation runnable from a clean checkout. Review docs in the same pull request as behavior/tooling changes.

## 14. Observability

Start lightweight: JSON structured logs, request IDs, health/readiness endpoints, error tracking, and cloud/container metrics. Each HTTP request and job emits start/completion/error events with duration, safe route template, status/result, correlation ID, and tenant ID only where policy permits. Capture unhandled exceptions in an error tracker with source maps/release version; scrub personal and financial fields first.

Expose metrics for request latency/count/errors, database pool health, job queue depth/failure/retry count, and dependency health. Dashboard and alert on error rate, readiness failures, background-job failures, and sustained latency—not every internal event. Audit logging is distinct from observability: audit events prove who changed what, while logs support diagnosis. Link them by request/correlation ID without duplicating sensitive payloads.

## 15. Mandatory engineering principles

1. Keep functions, modules, and pull requests small and single-purpose.
2. Prefer simple composition and explicit dependencies to inheritance, globals, and framework magic.
3. Type all public boundaries; validate all untrusted input; make configuration immutable after startup.
4. Fail fast on invalid settings, missing migrations, unsafe dependencies, and violated invariants.
5. No magic numbers or hidden behavior: name a policy/configuration value and document its intent.
6. Never commit secrets, customer data, generated credentials, or production exports.
7. Treat tenant isolation, authorization, idempotency, auditability, and money precision as non-negotiable requirements.
8. Write tests before merging; do not skip, mute, or lower a test to pass CI without a tracked remediation decision.
9. Prefer backward-compatible database/API evolution; use expand-contract migrations and versioned contracts.
10. Error messages must help a legitimate user recover while revealing no internal secrets or tenant data.
11. Review dependency, security, performance, and operability implications in every non-trivial pull request.
12. Automate repeatable tasks, but keep production deployment approvals explicit for the MVP.

## 16. Risks and guardrails

The primary overengineering risk is implementing every listed package/tool immediately. Start with two deployables, one contract pipeline, one local compose stack, and a short set of enforced checks; introduce shared UI, durable workers, RLS, E2E, and Terraform modules as their concrete need appears. Conversely, omitting PostgreSQL integration tests, migration validation, typed settings, or secret scanning creates unacceptable fintech risk and should not be deferred.

Poetry plus npm workspaces add two ecosystems; mitigate with one-command task aliases and clean setup documentation. Generated API clients can create noisy diffs; run generation only in CI or an explicit developer command and review changes as contract changes. Strict hooks can slow iteration; keep local hooks fast and reserve the full matrix for CI.

The foundation is intentionally designed around a modular monolith. Its clear application/package boundaries permit later extraction of workers, integration sync, or reporting workloads, but no service should be split merely because the folders are separate. This is the smallest operational shape that protects future FinanceOS engineering quality.
