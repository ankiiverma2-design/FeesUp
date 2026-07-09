# FeesUp — Requirements

**Tagline:** Collect. Track. Relax.

FeesUp is a web app that automates fee collection for home tutors in India (typically
15–40 students). It replaces memory + WhatsApp + paper notebooks with student management,
automated WhatsApp reminders, and UPI/Razorpay payment collection in one dashboard.

## Locked planning decisions

- **Money model: Model B (SaaS-only) for launch.** Each tutor connects their own Razorpay
  account; payments go directly to the tutor. The platform monetizes via subscription
  (₹99–299/month). Razorpay Route + 1% split is deferred to a later phase because it requires
  per-tutor KYC and Route approval that would block launch.
- **ORM: Prisma** (migrations + type safety).
- **Repo structure: single repo** with `/backend` (Express) and `/frontend` (React).
- **Build order: Phase 0 (foundations) + Phase 1 (core product) first**, then payments,
  reminders, monetization.

## Feature phases

### Phase 0 — Foundations
- Express REST API skeleton with CORS, centralized error handling, request validation (zod).
- Prisma schema + migrations for all tables.
- JWT authentication: tutor signup + login (email + password, hashed with bcrypt).
- Auth middleware and strict multi-tenant scoping (every query filtered by `tutorId`).
- Provider adapter interfaces (`PaymentProvider`, `MessagingProvider`) with mock
  implementations so the app is fully testable without external network access.
- `.env.example`, README with setup/run/deploy steps.

### Phase 1 — Core product (no external dependencies)
- Student management: add, edit, soft-delete, list. Fields: student name, parent name,
  parent WhatsApp (E.164), monthly fee (paise), fee due day of month.
- Free-tier cap: max 10 active students; blocked at API on creation with a clear message.
- Fee records: one row per student per month/year. Generated on demand + by a monthly job.
  Idempotent via `UNIQUE(student_id, month, year)`.
- Dashboard: current-month status per student (pending / paid / overdue), with overdue
  derived from due date + unpaid.
- Summary cards: total expected, total collected, total pending, number of defaulters.
- React dashboard: brand theme (black #111111 background, green #00D97E accent, white text),
  status color coding (green paid / red overdue / yellow pending), month switcher.

### Phase 2 — Payments (Razorpay, test mode) — later
- Razorpay Payment Links per student/month, stored + reused.
- Webhook receiver with HMAC signature verification, idempotency via `webhook_events`,
  auto-match via `notes` (studentId + month + year), auto-mark paid.

### Phase 3 — WhatsApp reminders — later
- PayPerWA adapter, 3 approved templates (pre-due, due, overdue).
- Daily reminder sweep (idempotent) + manual trigger.

### Phase 4 — Monetization & onboarding — later
- Subscription (₹99–299/month), free-tier enforcement, tutor onboarding.
- (Optional) Razorpay Route + 1% split (Model A upgrade).

## Non-functional requirements
- All money stored as integer paise; never floats.
- All timestamps stored UTC; business date logic computed in `Asia/Kolkata`.
- Secrets only via environment variables; never committed.
- Passwords hashed (bcrypt); JWT with reasonable expiry.
- Rate limiting on auth and (later) reminder endpoints.
- CORS locked to the frontend origin.
- Portable: standard React + Express + Postgres, documented README + `.env.example`,
  so the project can be continued in any IDE/agent.

## User stories (Phase 0 + 1)
1. As a tutor, I can sign up and log in so my data is private to me.
2. As a tutor, I can add/edit/remove students with their fee details.
3. As a tutor, I am limited to 10 students on the free tier.
4. As a tutor, I can see this month's fee status for every student at a glance.
5. As a tutor, I can see summary totals (expected, collected, pending, defaulters).
6. As a tutor, I can mark a student paid/unpaid manually (before payments integration).
7. As a tutor, I can switch months to view historical status.
