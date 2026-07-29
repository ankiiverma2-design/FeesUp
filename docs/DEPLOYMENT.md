# Deployment & Go-Live Guide

This walks you from the merged repo to a running FeesUp in production. It's ordered — do the
steps top to bottom. Items marked **[you]** need your accounts/decisions; everything else is
already wired in the repo.

## Overview
- **Database:** Supabase (Postgres, free tier)
- **Backend API:** Render (free web service) — `backend/render.yaml` blueprint included
- **Frontend:** Vercel — `frontend/vercel.json` included
- **Scheduled jobs:** GitHub Actions cron — `.github/workflows/scheduled-jobs.yml` (free)
- **CI:** GitHub Actions — `.github/workflows/ci.yml` (build + tests on every push)

Providers default to `mock`, so the app runs fully before you have any Razorpay/PayPerWA keys.
Flip them to live when ready — no code changes.

---

## 1. Merge PR #1  **[you]**
Verify locally (below), then merge so `main` holds the code. Deploys track `main`.

### Local smoke test
The fastest way to get a local Postgres is Docker (a `docker-compose.yml` is included):
```bash
docker compose up -d          # starts Postgres on localhost:5432 (matches .env.example)

# backend
cd backend && cp .env.example .env      # DATABASE_URL already matches docker-compose; set JWT_SECRET
npm install && npx prisma db push && npm test && npm run dev
# frontend (new terminal)
cd frontend && cp .env.example .env      # set VITE_API_URL=http://localhost:4000
npm install && npm run dev               # http://localhost:5173
```
Sign up, add a student, toggle paid/pending, open Settings. If that works, merge.

> **Schema sync:** we use `prisma db push` (syncs `schema.prisma` to the DB) because no
> migration history is committed yet. When you want versioned migrations, run
> `npx prisma migrate dev --name init` once, commit the generated `prisma/migrations/`, and
> switch the Render start command to `prisma migrate deploy`.

## 2. Database — Supabase  **[you]**
1. Create a project at supabase.com (free tier).
2. Project Settings > Database > Connection string (URI). Copy it — this is `DATABASE_URL`.
3. Tables are created automatically by the backend on deploy (`prisma db push`).

## 3. Backend — Render  **[you]**
1. On Render: New + > Blueprint, connect this repo. It reads `backend/render.yaml`.
2. Set the env vars marked `sync: false`:
   - `DATABASE_URL` = your Supabase URI
   - `FRONTEND_ORIGIN` = your Vercel URL (fill after step 4; can update later)
   - `INTERNAL_JOB_SECRET` = a long random string (remember it for step 5)
   - Leave `PAYMENT_PROVIDER` / `MESSAGING_PROVIDER` as `mock` for now
3. Deploy. Confirm `https://<your-api>.onrender.com/health` returns `{"status":"ok"}`.

## 4. Frontend — Vercel  **[you]**
1. On Vercel: New Project > import this repo. Set **Root Directory = `frontend`**.
2. Env var: `VITE_API_URL` = your Render API URL (from step 3).
3. Deploy. Then go back to Render and set `FRONTEND_ORIGIN` to the Vercel URL (for CORS).

## 5. Scheduled jobs — GitHub Actions  **[you]**
The workflow is already in the repo. Add two repo secrets
(Settings > Secrets and variables > Actions):
- `API_URL` = your Render API URL
- `INTERNAL_JOB_SECRET` = the same value you set on Render in step 3

Runs daily (reminders) and monthly (fee generation). You can also trigger it manually from the
Actions tab (workflow_dispatch) to test.

---

## 6. Go live: Payments (Razorpay)  **[you]**
1. Create a Razorpay account. Start in **Test mode** (no KYC needed).
2. Settings > API Keys: generate test `key_id` / `key_secret`.
3. On Render set: `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
4. Razorpay Dashboard > Webhooks: add
   `https://<your-api>.onrender.com/api/webhooks/razorpay`, subscribe to **`payment_link.paid`**,
   set a secret, and put the same value in `RAZORPAY_WEBHOOK_SECRET` on Render.
5. Test: generate a link in the app, pay with a Razorpay test card/UPI, confirm the student
   flips to Paid automatically.
6. When ready for real money: complete Razorpay KYC and swap test keys for live keys.

## 7. Go live: WhatsApp (PayPerWA)  **[you]**
1. Create a PayPerWA account; get `PAYPERWA_API_KEY` and the API base URL.
2. Submit the 3 templates in `docs/WhatsAppTemplates.md` for Meta approval (do this early).
3. Confirm PayPerWA's request/response shape and adjust `PayPerWAMessagingProvider.js` if needed.
4. On Render set: `MESSAGING_PROVIDER=payperwa`, `PAYPERWA_API_KEY`, `PAYPERWA_BASE_URL`.
5. Test with the manual "Remind" button, then rely on the daily sweep.

## 8. Subscriptions (real billing) — later
`POST /api/subscription/upgrade` currently activates Pro immediately. To charge real money,
create a Razorpay Subscription there and only flip the plan on the subscription webhook.

---

## Environment variables reference
| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | backend | Supabase Postgres URI |
| `JWT_SECRET` | backend | long random string (Render can generate) |
| `JWT_EXPIRES_IN` | backend | default `7d` |
| `FRONTEND_ORIGIN` | backend | Vercel URL(s), comma-separated, for CORS |
| `INTERNAL_JOB_SECRET` | backend + GH secret | must match on both sides |
| `PAYMENT_PROVIDER` | backend | `mock` or `razorpay` |
| `MESSAGING_PROVIDER` | backend | `mock` or `payperwa` |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | backend | Razorpay |
| `PAYPERWA_API_KEY/BASE_URL` | backend | PayPerWA |
| `VITE_API_URL` | frontend | backend base URL |
| `API_URL` | GH secret | backend base URL (for cron) |

## Troubleshooting
- **CORS errors:** `FRONTEND_ORIGIN` on the backend must exactly match the frontend origin.
- **Webhook not marking paid:** check the webhook secret matches and that `payment_link.paid`
  is subscribed; inspect the `webhook_events` table.
- **Render free tier sleeps:** first request after idle is slow; the GitHub cron still works
  (it wakes the service). Webhooks from Razorpay are retried, so a cold start is tolerated.
