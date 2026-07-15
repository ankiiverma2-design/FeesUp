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
- TODO (productionise Model B): pay each tutor into their own account via Route/OAuth.

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

## Phase 4 — Monetisation & onboarding  ✅ DONE (billing mocked)
- Plans in `config/plans.js` (Free = 10 students, Pro = ₹199/mo unlimited).
- `GET /api/subscription`, `POST /api/subscription/upgrade|cancel`; free-tier cap enforced on
  student creation.
- Tutor onboarding `PATCH /api/tutor/profile` (name, phone, PAN, bank account, IFSC) with
  validation. Settings page in the frontend (billing + profile).
- TODO: real Razorpay subscription billing behind `upgrade`; (optional) Route linked accounts
  + 1% split (Model A).

## Phase 5 — Hardening & deploy  ⏳ NEXT
- Add tests around auth, tenant scoping, fee generation, webhook idempotency.
- Wire external cron (GitHub Actions / cron-job.org / QStash) to internal endpoints.
- Deploy: Vercel (frontend) + Render/Railway (backend) + Supabase (db); register webhook URL.
- Observability: request logging, error alerts.
