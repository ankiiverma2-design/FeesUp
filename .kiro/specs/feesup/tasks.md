# FeesUp — Implementation Tasks

## Phase 0 — Foundations
- [x] Repo scaffold: `/backend`, `/frontend`, root README, `.gitignore`.
- [x] Backend package.json + Express app + config + CORS + Helmet + error handler + zod validation.
- [x] Prisma schema + initial migration (Tutor, Student, FeeRecord, Reminder, Payment, WebhookEvent).
- [x] JWT auth: signup, login, me; bcrypt hashing; auth middleware; tenant scoping helper.
- [x] Provider adapters: PaymentProvider + MessagingProvider interfaces + mock implementations.
- [x] `.env.example`.

## Phase 1 — Core product
- [x] Student CRUD with zod validation, 10-student free cap, soft delete.
- [x] Fee record generation (on-demand + `/internal/jobs/generate-fee-records`), idempotent.
- [x] Dashboard endpoint: rows with derived status + summary cards.
- [x] Manual mark paid/pending endpoint.
- [x] Frontend: Vite + Tailwind theme, auth context, axios interceptor, routing.
- [x] Frontend: Login/Signup pages.
- [x] Frontend: Dashboard (summary cards, student table with status colors, month switcher).
- [x] Frontend: Add/Edit/Delete student modal.

## Phase 2 — Payments
- [x] Razorpay payment links + webhook (test mode).

## Phase 3 — WhatsApp
- [x] PayPerWA reminders + templates + daily sweep + manual trigger.

## Phase 4 — Monetisation
- [x] Subscription billing (mock immediate / Razorpay Payment Link) + onboarding.

## Phase 5 — Hardening & deploy
- [x] Unit + integration tests (auth, CORS, fee status, providers, reminders, smoke).
- [x] CI + scheduled-jobs workflows.
- [x] Deploy configs (Render, Vercel) + docs.

## Verify & ship
- [x] Install deps, generate Prisma client, build both apps, lint.
- [ ] User: deploy with own Supabase / Render / Razorpay / PayPerWA accounts (`docs/FINISH.md`).

## Deferred (optional later)
- [ ] Versioned Prisma migrations.
- [ ] Recurring Razorpay Subscriptions for Pro.
- [ ] Model A: Route linked accounts + 1% split.
