# FeesUp — Design

## Architecture

```
React SPA (Vercel)  --HTTPS/JWT-->  Express REST API (Render/Railway)  --SQL-->  Postgres (Supabase)
                                     |- Scheduler (external cron -> protected endpoint)
                                     |- Provider adapters: PaymentProvider, MessagingProvider (mock | live)
                                     |- Webhook receiver (Razorpay) [Phase 2]
```

### Key structural decisions
- **Provider adapters.** External services (Razorpay, PayPerWA) sit behind interfaces with a
  `mock` implementation selected via env (`PAYMENT_PROVIDER`, `MESSAGING_PROVIDER`). Enables
  full local dev/testing offline; flip to `live` when credentials/approvals land.
- **Scheduler.** Monthly fee generation + reminder sweep run as jobs invoked by an external
  cron hitting a secret-protected `/internal/jobs/*` route (reliable on sleeping free tiers).
- **Tenant scoping.** `tutorId` is taken from the JWT, never from the request body. A helper
  ensures every data access is filtered by `tutorId`.

## Data model (Prisma)

- **Tutor**: id, email (unique), passwordHash, name, phone?, panNumber?, bankAccount?, ifsc?,
  razorpayAccountId?, subscriptionPlan (FREE|PRO), subscriptionStatus, createdAt.
- **Student**: id, tutorId, studentName, parentName, parentWhatsapp (E.164), monthlyFee (paise int),
  feeDueDay (1–28), isActive (soft delete), createdAt.
- **FeeRecord**: id, studentId, tutorId, month (1–12), year, amount (paise int),
  status (PENDING|PAID), paymentLink?, razorpayPaymentLinkId?, paidAt?, transactionId?, createdAt.
  Unique (studentId, month, year). *Overdue is derived* (unpaid + past due date), not stored.
- **Reminder**: id, studentId, feeRecordId, tutorId, reminderType (PRE_DUE|DUE|OVERDUE),
  channel, templateName?, providerMessageId?, status (QUEUED|SENT|DELIVERED|FAILED), error?, sentAt.
- **Payment**: id, tutorId, feeRecordId?, razorpayPaymentId, amount, status, raw (Json), createdAt.
- **WebhookEvent**: id, provider, eventId (unique), payload (Json), processedAt?, createdAt.

Enums: SubscriptionPlan, FeeStatus, ReminderType, ReminderStatus.

## Status semantics
- Stored `status ∈ {PENDING, PAID}`.
- Derived at read time: `OVERDUE` when `status = PENDING` and today's date (IST) is past the
  fee record's due date. Due date = `feeDueDay` of the record's month/year.

## Money & time
- All amounts integer paise. Format to ₹ only in UI.
- DB in UTC. Month/year and due-date comparisons computed in `Asia/Kolkata`.

## API (Phase 0 + 1)

Auth:
- `POST /api/auth/signup` { name, email, password } -> { token, tutor }
- `POST /api/auth/login`  { email, password } -> { token, tutor }
- `GET  /api/auth/me` -> { tutor }  (auth)

Students (auth, tenant-scoped):
- `GET    /api/students`
- `POST   /api/students`         (enforces 10 active-student free cap)
- `PATCH  /api/students/:id`
- `DELETE /api/students/:id`     (soft delete)

Dashboard (auth):
- `GET /api/dashboard?month=&year=` -> { period, summary, rows[] }
  - rows: student + this-period fee record (generated if missing) + derived status
  - summary: totalExpected, totalCollected, totalPending, defaulters
- `PATCH /api/fee-records/:id/status` { status } -> manual mark paid/pending (pre-Phase-2)

Internal jobs (secret header):
- `POST /internal/jobs/generate-fee-records` { month?, year? }

## Validation & errors
- zod schemas per route; a validation middleware returns 400 with field errors.
- Central error handler returns `{ error: { message, code? } }`; never leak stack traces.

## Frontend
- Vite + React + React Router + Axios + Tailwind.
- Theme tokens: bg `#111111`, surface `#1A1A1A`, accent `#00D97E`, text `#FFFFFF`,
  paid=green, overdue=red, pending=yellow.
- Auth context stores JWT (localStorage) + axios interceptor attaches bearer token.
- Pages: Login, Signup, Dashboard (summary cards + student table + month switcher +
  add/edit/delete modal).

## Security
- bcrypt password hashing; JWT (HS256) with expiry.
- CORS locked to `FRONTEND_ORIGIN`.
- Rate limit auth routes.
- Helmet headers.
