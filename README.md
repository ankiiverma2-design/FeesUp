# FeesUp

**Collect. Track. Relax.**

FeesUp is a tuition fee management web app for home tutors in India. It replaces memory,
WhatsApp chats, and paper notebooks with a single dashboard for student management, fee
tracking, automated WhatsApp reminders, and UPI/Razorpay payment collection.

This repository is a single repo containing:

- **`/backend`** — Node.js + Express REST API, Prisma ORM, PostgreSQL, JWT auth.
- **`/frontend`** — React (Vite) + Tailwind CSS single-page app.
- **`.kiro/specs/feesup`** — living plan: `requirements.md`, `design.md`, `tasks.md`.

## Status

Implemented so far (Phase 0 + Phase 1):

- Tutor signup / login with JWT auth and bcrypt password hashing.
- Multi-tenant isolation (all data scoped to the logged-in tutor).
- Student management: add / edit / soft-delete, with a 10-student free-tier cap.
- Monthly fee records (one per student per month), generated on demand and via a job.
- Dashboard with per-student status (paid / pending / overdue) and summary cards.
- Manual "mark paid / pending" (before the Razorpay integration).
- Provider adapters (payments + WhatsApp) with mock implementations so everything runs
  offline; live Razorpay / PayPerWA slot in behind the same interfaces later.

Deferred to later phases: Razorpay payment links + webhook, PayPerWA reminders,
subscription billing, tutor onboarding / Razorpay Route split.

## Tech stack

| Layer     | Tech                                             |
|-----------|--------------------------------------------------|
| Frontend  | React, Vite, Tailwind CSS, React Router, Axios   |
| Backend   | Node.js, Express, Prisma, zod, JWT, bcrypt       |
| Database  | PostgreSQL (Supabase)                            |

## Prerequisites

- Node.js 18+ (20+ recommended)
- A PostgreSQL database (local Postgres or a free Supabase project)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev      # creates tables
npm run dev                 # starts API on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # set VITE_API_URL (default http://localhost:4000)
npm install
npm run dev                 # starts app on http://localhost:5173
```

Open http://localhost:5173, sign up as a tutor, and start adding students.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Secrets are never
committed — only the `.env.example` templates are.

## Project conventions

- Money is stored as integer **paise** (never floats); formatted to ₹ only in the UI.
- Timestamps are stored in **UTC**; business date logic (due dates, month boundaries) is
  computed in **Asia/Kolkata**.
- Fee status is stored as `PENDING` / `PAID`; **overdue is derived** (unpaid + past due date).

## Portability

This is a standard React + Express + Postgres project with a documented README and
`.env.example` files. It has no dependency on any particular editor or AI tool, so it can be
cloned and continued in any IDE or agent.
