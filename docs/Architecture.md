# Architecture

## Overview

```
React SPA (Vercel)
   │  HTTPS + JWT (Bearer)
   ▼
Express REST API (Render/Railway)
   │  ├─ Auth (JWT, bcrypt)
   │  ├─ Tenant scoping (tutorId from token)
   │  ├─ Provider adapters: PaymentProvider, MessagingProvider  (mock | live)
   │  ├─ Scheduler jobs (invoked by external cron -> /internal/jobs/*)
   │  └─ Webhook receiver (Razorpay)   [Phase 2]
   ▼
PostgreSQL (Supabase)  via Prisma
```

## Technical stack
| Layer     | Tech                                             |
|-----------|--------------------------------------------------|
| Frontend  | React, Vite, Tailwind CSS, React Router, Axios   |
| Backend   | Node.js, Express, Prisma, zod, JWT, bcryptjs     |
| Database  | PostgreSQL (Supabase)                            |
| Payments  | Razorpay Payment Links + Webhooks (Phase 2)      |
| WhatsApp  | PayPerWA (Phase 3)                               |
| Hosting   | Vercel (frontend), Render/Railway (backend), Supabase (db) |

## Key architectural decisions
- **Provider adapters.** External vendors (Razorpay, PayPerWA) sit behind interfaces
  (`PaymentProvider`, `MessagingProvider`). Implementation is chosen via env
  (`PAYMENT_PROVIDER`, `MESSAGING_PROVIDER`). Mock implementations let the app run and be
  tested fully offline; live adapters slot in later with no changes to callers.
- **Tenant isolation.** `tutorId` is always read from the verified JWT, never from the
  request body. Services filter every query by `tutorId`.
- **Scheduler via external cron.** Monthly fee generation and (later) reminder sweeps are
  triggered by an external cron hitting a secret-protected `/internal/jobs/*` endpoint —
  reliable even when free-tier hosting sleeps.
- **Money & time.** All amounts are integer paise. DB stores UTC; due-date / month logic is
  computed in Asia/Kolkata (IST).
- **Status model.** Fee status is stored as `PENDING | PAID`. `OVERDUE` is *derived* at read
  time from the due date, avoiding scheduled-write race conditions.

## Data model (see backend/prisma/schema.prisma)
- **Tutor** — auth + profile + subscription + (Model B) own Razorpay account id.
- **Student** — belongs to a tutor; monthlyFee (paise), feeDueDay, isActive (soft delete).
- **FeeRecord** — one per student per month/year; unique (studentId, month, year); amount,
  status, payment link fields, paidAt, transactionId.
- **Reminder** — per fee record + type; provider message id + delivery status.
- **Payment** — Razorpay payment record; unique razorpayPaymentId.
- **WebhookEvent** — raw webhook log for idempotent processing (unique eventId).

## File & folder structure
```
FeesUp/
├── README.md
├── .gitignore
├── docs/                         # PRD, Architecture, Rules, Phases, Design, Memory
├── .kiro/specs/feesup/           # requirements.md, design.md, tasks.md (Kiro spec)
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── server.js             # entry: starts HTTP server
│       ├── app.js                # express app + middleware wiring
│       ├── config/env.js         # env loading/validation
│       ├── lib/                  # prisma client, time (IST) helpers
│       ├── middleware/           # auth, validate, internal, error
│       ├── providers/            # payment + messaging adapters (interfaces + mocks)
│       ├── routes/               # auth, students, dashboard, feeRecords, internal
│       ├── services/             # authService, studentService, feeRecordService
│       ├── validators/           # zod schemas
│       └── utils/                # ApiError, asyncHandler
└── frontend/
    ├── package.json
    ├── index.html
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.jsx              # entry + providers
        ├── App.jsx               # routes
        ├── index.css             # Tailwind + theme components
        ├── api/client.js         # axios instance + token handling
        ├── context/AuthContext.jsx
        ├── lib/format.js         # money + date formatting
        ├── components/           # Logo, StatusBadge, SummaryCards, MonthSwitcher,
        │                         #   StudentTable, StudentModal, ProtectedRoute
        └── pages/                # Login, Signup, Dashboard
```

## API surface (Phase 0 + 1)
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/students`, `PATCH/DELETE /api/students/:id`
- `GET /api/dashboard?month=&year=`
- `PATCH /api/fee-records/:id/status`
- `POST /internal/jobs/generate-fee-records` (secret header)
- `GET /health`

## Request flow example (dashboard)
1. React calls `GET /api/dashboard` with the JWT.
2. `requireAuth` verifies the token → `req.tutor.id`.
3. Handler ensures fee records exist for the period (idempotent generation).
4. Loads active students + this period's fee record, derives status, computes summary.
5. Returns `{ period, summary, rows }`; UI renders cards + colour-coded table.
