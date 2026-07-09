# FeesUp — Implementation Tasks

## Phase 0 — Foundations
- [ ] Repo scaffold: `/backend`, `/frontend`, root README, `.gitignore`.
- [ ] Backend package.json + Express app + config + CORS + Helmet + error handler + zod validation.
- [ ] Prisma schema + initial migration (Tutor, Student, FeeRecord, Reminder, Payment, WebhookEvent).
- [ ] JWT auth: signup, login, me; bcrypt hashing; auth middleware; tenant scoping helper.
- [ ] Provider adapters: PaymentProvider + MessagingProvider interfaces + mock implementations.
- [ ] `.env.example`.

## Phase 1 — Core product
- [ ] Student CRUD with zod validation, 10-student free cap, soft delete.
- [ ] Fee record generation (on-demand + `/internal/jobs/generate-fee-records`), idempotent.
- [ ] Dashboard endpoint: rows with derived status + summary cards.
- [ ] Manual mark paid/pending endpoint.
- [ ] Frontend: Vite + Tailwind theme, auth context, axios interceptor, routing.
- [ ] Frontend: Login/Signup pages.
- [ ] Frontend: Dashboard (summary cards, student table with status colors, month switcher).
- [ ] Frontend: Add/Edit/Delete student modal.

## Verify & ship
- [ ] Install deps, generate Prisma client, build both apps, lint.
- [ ] Push to branch + open PR.

## Deferred (later phases)
- [ ] Phase 2: Razorpay payment links + webhook (test mode).
- [ ] Phase 3: PayPerWA reminders + templates + daily sweep + manual trigger.
- [ ] Phase 4: Subscription billing + onboarding + optional Route/1% split.
