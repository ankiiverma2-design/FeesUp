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

Implemented (Phases 0–4, against mock/test providers):

- Tutor signup / login with JWT auth and bcrypt password hashing; multi-tenant isolation.
- Student management: add / edit / soft-delete, with a 10-student free-tier cap.
- Monthly fee records (one per student per month), generated on demand and via a job.
- Dashboard with per-student status (paid / pending / overdue) and summary cards.
- Manual "mark paid / pending".
- Razorpay payment links per fee record + webhook that auto-marks paid (idempotent, signature-verified).
- WhatsApp reminders: 3 templates (pre-due / due / overdue), manual trigger + daily sweep.
- Subscription (Free / Pro) + tutor onboarding (PAN / bank) via a Settings page.
- Provider adapters (payments + WhatsApp): mock by default; real Razorpay (test mode) and
  PayPerWA wired — flip `PAYMENT_PROVIDER` / `MESSAGING_PROVIDER` + add keys to go live.

Tooling: unit tests (`npm test` in `backend/`), GitHub Actions **CI** (build + tests on every
push), a scheduled-jobs workflow (reminders + monthly fee generation), and deploy configs for
Vercel + Render + Supabase.

To deploy / go live, follow **`docs/DEPLOYMENT.md`**. WhatsApp template texts for Meta approval
are in **`docs/WhatsAppTemplates.md`**.

**Frontend options:** this repo ships a reference React UI in `/frontend`, but the frontend can
also be built separately (e.g. in **Lovable**) against this API. See **`docs/API.md`** for the
endpoint reference + a copy-paste Lovable prompt, and **`backend/openapi.yaml`** (served live at
`GET /openapi.yaml`) for the machine-readable contract. CORS accepts Lovable preview domains via
`FRONTEND_ORIGIN` wildcards (e.g. `*.lovableproject.com`).

Next: real subscription billing and Model A (Razorpay Route + 1% split). See `docs/Phases.md`.

## Tech stack

| Layer     | Tech                                             |
|-----------|--------------------------------------------------|
| Frontend  | React, Vite, Tailwind CSS, React Router, Axios   |
| Backend   | Node.js, Express, Prisma, zod, JWT, bcrypt       |
| Database  | PostgreSQL (Supabase)                            |

## Prerequisites

- Node.js 18+ (20+ recommended)
- A PostgreSQL database — use the included `docker compose up -d`, or a free Supabase project

## Quick start (local)

```bash
docker compose up -d                 # Postgres on localhost:5432 (matches backend/.env.example)
cd backend && cp .env.example .env   # set JWT_SECRET
npm install && npx prisma db push && npm run dev
# new terminal
cd frontend && cp .env.example .env  # set VITE_API_URL=http://localhost:4000
npm install && npm run dev           # http://localhost:5173
```

**Going live?** The full ordered checklist is in **`docs/FINISH.md`**; it's summarized below.
To turn on Razorpay payments and WhatsApp reminders later, see **`docs/INTEGRATIONS.md`**.

## Remaining steps to go live

The code is complete, tested, and self-verifying (CI). What's left are steps that require
**your own accounts and clicks** — no coding needed. Do them top to bottom.

Legend: [done] already done for you · [you] you do this (account/click).

1. **[done] App built** — backend, reference frontend, tests, CI, deploy configs, docs.
2. **[you] Run locally once** (~10 min): `docker compose up -d`, then start backend + frontend
   (see Quick start above). Sign up, add a student, mark paid, open Settings.
3. **[you] Merge PR #1** so `main` holds everything (skip if already pushed to `main`).
4. **[you] Database — Supabase**: create a free project, copy the Postgres connection string —
   that becomes your `DATABASE_URL`.
5. **[you] Deploy backend — Render**: New + → Blueprint → this repo (reads `render.yaml` at root).
   Set `DATABASE_URL`, `JWT_SECRET`, `INTERNAL_JOB_SECRET`, and `FRONTEND_ORIGIN`. Tables
   auto-create on boot (`prisma db push`). Check `/health`.
6. **[you] Deploy frontend**: **simplest path — build the whole app in Lovable** using the
   paste-ready brief in **`docs/LOVABLE_BRIEF.md`** (Lovable uses React + Supabase and handles
   all the code). Alternatively, build only the UI against this API (`docs/API.md` +
   `/openapi.yaml`), or deploy the bundled `/frontend` to **Vercel**
   (Root Directory = `frontend`, set `VITE_API_URL`). Then add the frontend URL to the backend
   `FRONTEND_ORIGIN` (wildcards like `*.lovableproject.com` are supported).
7. **[you] Scheduled reminders — GitHub Actions**: add repo secrets `API_URL` and
   `INTERNAL_JOB_SECRET` (matching Render). Daily reminders + monthly fee generation then run
   automatically.
8. **[you] Payments — Razorpay (test mode, no KYC)**: generate test API keys, set
   `PAYMENT_PROVIDER=razorpay` + keys on Render. Add webhook
   `https://<api>/api/webhooks/razorpay` for `payment_link.paid` and set
   `RAZORPAY_WEBHOOK_SECRET`. (Real money later = finish KYC, swap to live keys.)
9. **[you] WhatsApp — PayPerWA**: create an account, **submit the 3 templates in
   `docs/WhatsAppTemplates.md` to Meta for approval** (start early — approval takes time), then
   set `MESSAGING_PROVIDER=payperwa` + key/base URL.

**Optional later:** versioned DB migrations (`prisma migrate dev`), real subscription billing,
and Model A (Razorpay Route + 1% split). See `docs/Phases.md`.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma db push          # creates tables from the schema
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
