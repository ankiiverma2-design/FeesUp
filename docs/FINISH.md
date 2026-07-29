# FINISH — the last steps to go live

The **code is complete and self-verifying** (tests + CI). What remains can only be done by you,
because it needs your own accounts, approvals, and button clicks. This is the whole list — do
it top to bottom. Each item says roughly how long it takes.

Legend: 🟢 = code is already done for you · 🔵 = you do this (account/click)

---

## 0. What's already done 🟢
- Backend API (auth, students, fee tracking, Razorpay payments + webhook, WhatsApp reminders,
  subscription, onboarding) — feature-complete behind provider adapters.
- Reference React frontend in `/frontend` (or build your own in Lovable — see `docs/API.md`).
- Tests (`npm test`), CI on every push, scheduled-jobs cron, deploy configs.
- Docs: PRD, Architecture, Rules, Phases, Design, API, DEPLOYMENT, WhatsApp templates, Postman.

## 1. Run it locally once 🔵 (~10 min)
```bash
docker compose up -d                       # local Postgres
cd backend && cp .env.example .env         # set JWT_SECRET (any long string)
npm install && npx prisma db push && npm test && npm run dev
# new terminal
cd frontend && cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm install && npm run dev                 # http://localhost:5173
```
Sign up, add a student, toggle paid, open Settings. (Tip: `docs/FeesUp.postman_collection.json`
lets you click-test the API directly.)

## 2. Merge PR #1 🔵 (~1 min)
Once local looks good, merge the pull request so `main` holds the code. CI will run on the merge.

## 3. Database — Supabase 🔵 (~5 min)
Create a free project → copy the Postgres connection string → that's your `DATABASE_URL`.

## 4. Deploy the backend — Render 🔵 (~10 min)
New + → Blueprint → pick this repo (reads `backend/render.yaml`). Set `DATABASE_URL`,
`INTERNAL_JOB_SECRET` (any long string), and later `FRONTEND_ORIGIN`. Tables auto-create on
boot (`prisma db push`). Check `/health`.

## 5. Deploy the frontend 🔵 (~10 min)
- **Lovable:** paste the prompt in `docs/API.md`, point it at your Render `API_URL` (and its
  `/openapi.yaml`). Tell it to use the existing API, not build a backend.
- **Or the bundled React app:** Vercel → import repo → Root Directory `frontend` → set
  `VITE_API_URL`.
Then add the frontend's URL to the backend `FRONTEND_ORIGIN` (wildcards like
`*.lovableproject.com` are supported).

## 6. Scheduled reminders — GitHub Actions 🔵 (~3 min)
Add repo secrets `API_URL` and `INTERNAL_JOB_SECRET` (matching Render). The workflow then runs
daily reminders + monthly fee generation. Test it from the Actions tab (Run workflow).

## 7. Payments — Razorpay (test mode) 🔵 (~15 min)
Create account → generate **test** API keys → on Render set `PAYMENT_PROVIDER=razorpay` +
keys. Add webhook `https://<api>/api/webhooks/razorpay` for `payment_link.paid` and set
`RAZORPAY_WEBHOOK_SECRET`. Pay a test link and watch the student flip to Paid. (Real money =
finish KYC, swap to live keys.)

## 8. WhatsApp — PayPerWA 🔵 (approval takes hours–days, so start early)
Create account → **submit the 3 templates in `docs/WhatsAppTemplates.md` to Meta** → once
approved, set `MESSAGING_PROVIDER=payperwa` + key/base URL (confirm the request shape in
`PayPerWAMessagingProvider.js`).

---

## Optional later (not required to launch)
- Versioned DB migrations: `npx prisma migrate dev --name init`, commit `prisma/migrations/`,
  switch Render start to `prisma migrate deploy`.
- Real subscription billing (Razorpay Subscription) behind `POST /api/subscription/upgrade`.
- Model A: Razorpay Route linked accounts + 1% split (per-tutor payouts).

## The honest bottom line
Everything a developer can build **is built, tested, and documented**. Steps 1–8 are account
signups, approvals, and clicks that require your credentials — no code needed. Follow them in
order and FeesUp is live.
