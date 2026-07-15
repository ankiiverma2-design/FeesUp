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
- **Next up:** Phase 5 — tests, external cron wiring, deploy (Vercel + Render/Railway +
  Supabase), register webhook URL. Plus productionise Model B payouts + real subscription billing.

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
