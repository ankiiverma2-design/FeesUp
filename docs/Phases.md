# Phases

The project is built in phases so it can be delivered and verified incrementally. Each phase
is usable on its own. Check items off as they land, and keep Memory.md updated.

## Phase 0 — Foundations  ✅ DONE
- Single-repo scaffold: `/backend` (Express) + `/frontend` (React), README, `.gitignore`.
- Prisma schema + models: tutors, students, fee_records, reminders, payments, webhook_events.
- JWT auth: signup, login, me; bcrypt hashing; auth middleware.
- Multi-tenant scoping helper (tutorId from token).
- Provider adapters (PaymentProvider, MessagingProvider) + mock implementations.
- zod validation, Helmet, CORS, centralized error handling, `.env.example`.

## Phase 1 — Core product  ✅ DONE
- Student CRUD with 10-student free-tier cap + soft delete.
- Monthly fee-record generation (on-demand + `/internal/jobs/generate-fee-records`), idempotent.
- Dashboard endpoint: per-student status + summary cards (expected/collected/pending/defaulters).
- Manual mark paid/pending (bridge before webhook).
- Frontend: theme, auth context, login/signup, dashboard (summary cards, month switcher,
  status badges), WhatsApp reminder deep link, add/edit/delete modal.

> After Phase 1 the app is fully usable as a manual fee tracker — no external services needed.

## Phase 2 — Payments (Razorpay, test mode)  ✅ DONE
- `RazorpayPaymentProvider` (REST via built-in fetch): creates Payment Links; stores
  `razorpayPaymentLinkId` + `paymentLink`; reuses per fee record (unique `reference_id`).
- studentId + month + year + feeRecordId placed in Razorpay `notes` for auto-matching.
- Webhook receiver `POST /api/webhooks/razorpay`: raw-body HMAC `X-Razorpay-Signature`
  verification, dedupe via `webhook_events` (event id), auto-match on `payment_link.paid`,
  mark Paid with timestamp + payment id, upsert `Payment`.
- Frontend: "Get link" generates, "Copy link" copies; paid status + txn id shown.
- Works in Razorpay **test mode** — no KYC needed. Set `PAYMENT_PROVIDER=razorpay` + keys.

## Phase 3 — WhatsApp reminders (PayPerWA)  ✅ DONE
- `PayPerWAMessagingProvider` (sends approved templates by name + ordered variables).
- 3 templates defined in `config/reminderTemplates.js`: pre-due (−3d), due (0), overdue (+3d).
  **Action:** submit these to Meta for approval before going live.
- `reminderService`: type logic (IST days-to-due), idempotent send per (fee_record, type),
  ensures a payment link, records delivery status.
- Manual trigger `POST /api/fee-records/:id/remind` (rate-limited); daily sweep
  `POST /internal/jobs/send-reminders`.
- Runs on mock offline; set `MESSAGING_PROVIDER=payperwa` + keys and confirm the request
  shape against PayPerWA docs to go live.

## Phase 4 — Monetisation & onboarding  ✅ DONE
- Plans in `config/plans.js` (Free = 10 students, Pro = ₹199/mo unlimited).
- `GET /api/subscription`, `POST /api/subscription/upgrade|cancel`; free-tier cap enforced on
  student creation.
- Tutor onboarding `PATCH /api/tutor/profile` (name, phone, PAN, bank account, IFSC) with
  validation. Settings page in the frontend (billing + profile).
- Pro upgrade billing: mock activates immediately; Razorpay creates a ₹199 Payment Link and
  the shared webhook flips the plan on `payment_link.paid` (`notes.purpose=subscription`).

## Phase 5 — Hardening & deploy  ✅ DONE
- Unit tests: auth (JWT + alg pinning), CORS origins, fee status derivation, payment providers
  (HMAC + fee/subscription webhook parse), reminder logic, time/format — 30 passing.
- Integration smoke test (auth, tenant isolation, students, dashboard, mark paid) behind
  `RUN_INTEGRATION=1`.
- External cron: GitHub Actions scheduled-jobs workflow → `/internal/jobs/*`.
- Deploy configs: Vercel (frontend) + Render (`render.yaml`) + Supabase (db).
- Observability: morgan `combined` access logs in production, `dev` locally; Helmet; structured
  API errors.

## Optional later (not required to launch)
- Versioned DB migrations: `npx prisma migrate dev --name init`, then `prisma migrate deploy`.
- Recurring Razorpay Subscriptions (instead of monthly Payment Links for Pro).
- Model A: Razorpay Route linked accounts + 1% split (per-tutor payouts).


## Frontend delivery — Lovable (API-driven)

The frontend is being built in **Lovable** against the existing REST API rather than using the
bundled `/frontend` React app (which stays as a working reference implementation).

- API contract: `backend/openapi.yaml`, served live at `GET /openapi.yaml`.
- Human reference + copy-paste Lovable prompt: `docs/API.md`.
- CORS: add the Lovable domain(s) to `FRONTEND_ORIGIN` — wildcards like `*.lovableproject.com`
  are supported.
- Lovable must consume this API (via `VITE_API_URL`) and NOT create its own backend/Supabase.
- All money from the API is in paise; `monthlyFee` is sent in rupees on create/update.
