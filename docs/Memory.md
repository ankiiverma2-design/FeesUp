# Memory — Living Progress Log

> Purpose: keep any AI tool or contributor up to date on what's built, decided, and next —
> so no one re-reads the whole codebase or invents facts. **Update this after every
> meaningful change.** Newest entry on top.

## Current state (snapshot)
- **Phases complete:** 0, 1, 2, 3, 4 — feature-complete against mock/test providers.
- **App does:** signup/login; student CRUD (10-cap + soft delete); monthly fee records;
  dashboard with status + summary; manual mark paid/pending; Razorpay payment links + webhook
  auto-mark-paid; WhatsApp reminders (3 templates, manual trigger + daily sweep); subscription
  (Free/Pro) + tutor onboarding (PAN/bank) via a Settings page.
- **Providers:** mock by default; real Razorpay (test mode) and PayPerWA adapters wired —
  flip `PAYMENT_PROVIDER=razorpay` / `MESSAGING_PROVIDER=payperwa` + add keys to go live.
- **Tooling in place:** unit tests (`npm test`, 12 passing), CI on every push, GitHub Actions
  scheduled cron, and deploy configs for Vercel + Render + Supabase.
- **API is documented for external frontends:** `backend/openapi.yaml` (served at `/openapi.yaml`)
  + `docs/API.md` with a Lovable prompt. Frontend will be built in **Lovable** against this API;
  `/frontend` remains a working reference. CORS accepts Lovable wildcard origins.
- **Next up:** everything code-side is done. Remaining work is user-only account/click steps —
  follow **`docs/FINISH.md`** (local run → merge → Supabase → Render → frontend/Lovable →
  GitHub cron secrets → Razorpay test keys + webhook → PayPerWA + Meta template approval).
  Optional later: versioned migrations, real subscription billing, Model A Route split.

## Locked decisions
- **Money model:** Model B (SaaS-only) for launch. Tutors connect their own Razorpay later;
  platform earns via subscription. Razorpay Route + 1% split deferred to Phase 4.
- **ORM:** Prisma. **Repo:** single repo (`/backend` + `/frontend`).
- **Providers:** behind adapter interfaces; `mock` implementations for now, selected via
  `PAYMENT_PROVIDER` / `MESSAGING_PROVIDER` env vars.
- **Conventions:** money in integer paise; UTC storage + IST business logic; fee status
  stored `PENDING|PAID` with `OVERDUE` derived; soft delete for students.

## Key files to know
- Backend entry: `backend/src/server.js` → `app.js`. Config: `backend/src/config/env.js`.
- Schema: `backend/prisma/schema.prisma`. Services: `backend/src/services/*`.
- Providers: `backend/src/providers/*` (add live adapters here).
- Frontend entry: `frontend/src/main.jsx` → `App.jsx`. API: `frontend/src/api/client.js`.
- Planning docs: `docs/*` and `.kiro/specs/feesup/*`.

## Environment notes
- Backend env template: `backend/.env.example` (DATABASE_URL, JWT_SECRET, provider selection,
  INTERNAL_JOB_SECRET, plus Razorpay/PayPerWA keys for later).
- Frontend env: `frontend/.env.example` (VITE_API_URL).
- Demo seed: `cd backend && npm run seed` → `demo@feesup.app` / `password123`.

## Open items / TODO for next session
- Submit the 3 WhatsApp templates (`config/reminderTemplates.js`) to Meta for approval.
- Confirm PayPerWA's exact request/response shape and adjust `PayPerWAMessagingProvider`.
- Replace the immediate `subscription.upgrade` with real Razorpay subscription billing
  (activate on the subscription webhook).
- Productionise Model B payouts: pay each tutor into their own account (Route/OAuth).
- Phase 5: tests (auth, tenant scoping, fee generation, webhook idempotency), external cron
  wiring to `/internal/jobs/*`, deploy, register the Razorpay webhook URL.

## Known limitations / caveats
- `npm install`, `vite build`, and `prisma migrate` were **not run** in the build sandbox
  (npm registry blocked). Run locally/CI to confirm install + build + migrations.
- Razorpay + subscription run in test/mock; going live needs KYC + real keys.
- PayPerWA request shape is a best-effort default pending confirmation against their docs.
- No automated tests yet (none requested). Add in Phase 5.

## Changelog
### 2026-07-09 — Finalization: DB, tests, Docker, Postman, FINISH checklist
- DB provisioning fixed: no migration files exist, so Render + CI use `prisma db push`
  (render.yaml startCommand + CI). Documented switching to migrations later.
- `docker-compose.yml` (Postgres 16) at repo root for one-command local DB (matches .env).
- Integration smoke test `backend/test/integration/api.test.js` (guarded by RUN_INTEGRATION +
  DATABASE_URL; lazy-requires app). Local `npm test` = 12 unit pass + 1 integration skipped.
- CI `integration` job added: postgres:16 service + `prisma db push` + `node --test test/integration/`.
- `docs/FeesUp.postman_collection.json` (auto-saves token on login/signup, all endpoints).
- `docs/FINISH.md`: single consolidated go-live checklist (🟢 done vs 🔵 user-only steps).

### 2026-07-09 — Lovable-ready API layer
- Decision: frontend will be built in **Lovable** against this API (the `/frontend` React app
  becomes a reference implementation, still valid).
- CORS now supports exact + wildcard origins (`*.lovableproject.com`) + "*" via `isAllowedOrigin`.
- Added `backend/openapi.yaml` (OpenAPI 3.0.3, all public endpoints) + served at `GET /openapi.yaml`.
- Added `docs/API.md`: endpoint reference, conventions (paise, JWT, derived OVERDUE), screens,
  brand theme, and a copy-paste Lovable prompt.
- Updated `.env.example` FRONTEND_ORIGIN guidance for Lovable domains.

### 2026-07-09 — Hardening, tests, CI & deploy configs
- Extracted pure `lib/reminderLogic.js` (determineReminderType) and **fixed a pre-due sign
  bug** (now fires when daysUntilDue === 3). Renamed config to `REMINDER_RULES`.
- Added `node:test` unit tests (`backend/test/`) for time, format, reminderLogic — 12 tests,
  all passing. Added `npm test` (= `node --test`).
- CI: `.github/workflows/ci.yml` (backend install/prisma/validate/test + frontend build).
- Scheduled jobs: `.github/workflows/scheduled-jobs.yml` (daily reminders, monthly fee gen)
  hitting `/internal/jobs/*` with `INTERNAL_JOB_SECRET` — free, host-agnostic.
- Deploy configs: `frontend/vercel.json`, `render.yaml` (repo root), `.nvmrc` (20) both apps.
- Docs: `docs/WhatsAppTemplates.md` (3 Meta-ready templates) + `docs/DEPLOYMENT.md` (go-live).

### 2026-07-09 — Phases 2–4 built
- Phase 2: RazorpayPaymentProvider (REST) + `paymentService` + payment-link route + raw-body
  webhook route (`/api/webhooks/razorpay`) with HMAC verify + idempotency via `webhook_events`;
  frontend "Get link" / "Copy link" + paid/txn display.
- Phase 3: PayPerWAMessagingProvider + `reminderTemplates` + `reminderService` (type logic,
  idempotent send, sweep); manual `POST /api/fee-records/:id/remind` (rate-limited) + internal
  `POST /internal/jobs/send-reminders`; frontend API-based Remind button.
- Phase 4: `plans.js` + `subscriptionService` (Free/Pro, upgrade/cancel) + `tutorService`
  onboarding (`PATCH /api/tutor/profile`); Settings page (billing + profile) + `/settings` route
  + auth context `refreshTutor`.
- Providers wired in factory; extended PaymentProvider with `parseWebhookEvent`.
- Verified: all backend `node --check` OK; all frontend files parse OK.

### 2026-07-09 — Docs set added
- Added `docs/`: PRD, Architecture, Rules, Phases, Design, Memory. No code changes.

### 2026-07-09 — Phase 0 + 1 shipped (PR #1)
- Scaffolded repo, Prisma schema (6 tables), JWT auth, provider mocks, zod validation,
  student CRUD (10-cap + soft delete), fee-record generation, dashboard + summary, manual
  status toggle, and full React UI in the black/green theme.
- Branch `feat/phase-0-1-foundations-core` → PR #1 against `main`.
