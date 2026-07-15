# Memory — Living Progress Log

> Purpose: keep any AI tool or contributor up to date on what's built, decided, and next —
> so no one re-reads the whole codebase or invents facts. **Update this after every
> meaningful change.** Newest entry on top.

## Current state (snapshot)
- **Phases complete:** Phase 0 (foundations) + Phase 1 (core product).
- **App works as:** a manual fee tracker — signup/login, manage students, monthly fee
  records, dashboard with status + summary, manual mark paid/pending, WhatsApp reminder
  deep link. No external services required yet (Razorpay/PayPerWA behind mock adapters).
- **Next up:** Phase 2 — Razorpay Payment Links + webhook (test mode).

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
- Phase 2: implement `RazorpayPaymentProvider.createPaymentLink` + webhook route
  (`/api/webhooks/razorpay`) with HMAC verify on raw body + idempotency via `webhook_events`.
  Add raw-body handling for just that route.
- Draft the 3 WhatsApp template texts and submit for Meta approval (Phase 3 prep).
- Add an `/internal/jobs/send-reminders` endpoint + reminder sweep logic (Phase 3).

## Known limitations / caveats
- `npm install`, `vite build`, and `prisma migrate` were **not run** in the build sandbox
  (npm registry blocked). Run locally/CI to confirm install + build + migrations.
- No automated tests yet (none requested). Add in Phase 5.

## Changelog
### 2026-07-09 — Docs set added
- Added `docs/`: PRD, Architecture, Rules, Phases, Design, Memory. No code changes.

### 2026-07-09 — Phase 0 + 1 shipped (PR #1)
- Scaffolded repo, Prisma schema (6 tables), JWT auth, provider mocks, zod validation,
  student CRUD (10-cap + soft delete), fee-record generation, dashboard + summary, manual
  status toggle, and full React UI in the black/green theme.
- Branch `feat/phase-0-1-foundations-core` → PR #1 against `main`.
