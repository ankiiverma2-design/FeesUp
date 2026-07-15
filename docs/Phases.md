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

## Phase 2 — Payments (Razorpay, test mode)  ⏳ NEXT
- Implement `RazorpayPaymentProvider`: create Payment Link per student/month; store
  `razorpayPaymentLinkId` + `paymentLink`; reuse for the month.
- Put studentId + month + year in Razorpay `notes` for auto-matching.
- Webhook receiver: verify `X-Razorpay-Signature` HMAC on the raw body, dedupe via
  `webhook_events`, auto-match, mark Paid with timestamp + transaction id.
- Frontend: show/copy/share payment link; reflect auto-paid status.
- All in Razorpay **test mode** — no KYC required to build/demo.

## Phase 3 — WhatsApp reminders (PayPerWA)
- Implement `PayPerWAMessagingProvider` (send approved templates).
- Submit 3 templates for Meta approval (start early — approval is out of our hands):
  pre-due (3 days before), due (on due date), overdue (3 days after).
- Daily reminder sweep (idempotent via unique reminder per fee_record + type), invoked by
  external cron → `/internal/jobs/send-reminders`.
- Manual "send reminder" trigger per student (rate-limited).

## Phase 4 — Monetisation & onboarding
- Subscription billing (₹99–299/month) on the platform's Razorpay account; enforce free-tier
  cap vs unlimited.
- Tutor onboarding: collect PAN + bank details.
- (Optional, Model A upgrade) Razorpay Route: create linked accounts + 1% split on payments.

## Phase 5 — Hardening & deploy
- Add tests around auth, tenant scoping, fee generation, webhook idempotency.
- Wire external cron (GitHub Actions / cron-job.org / QStash) to internal endpoints.
- Deploy: Vercel (frontend) + Render/Railway (backend) + Supabase (db); register webhook URL.
- Observability: request logging, error alerts.
