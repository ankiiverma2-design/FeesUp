# Security

A summary of the security measures built into the FeesUp backend, and the operational practices
to keep it safe in production.

## Authentication & sessions
- Passwords are hashed with **bcrypt** (never stored or logged in plaintext).
- Auth uses **JWT (HS256)**. The signing algorithm is **pinned on both sign and verify**
  (`algorithms: ['HS256']`) to prevent algorithm-confusion attacks.
- The `passwordHash` field is stripped from every tutor object returned to clients.
- Login returns a generic "Invalid email or password" (no "which field was wrong" leakage).

## Multi-tenant isolation
- The tutor id is taken **only from the verified JWT** (`req.tutor.id`), never from the request
  body or query. Every data query is scoped by `tutorId`, so tutors can only ever see their own
  students, fee records, and payments.

## Input validation
- All request bodies/queries are validated with **zod** before hitting business logic.
- Invalid input returns a structured `400` with field-level messages — no stack traces.

## Rate limiting (Render `trust proxy` aware)
- **Global:** 300 requests/minute per IP across `/api`.
- **Auth routes:** 30 requests / 15 minutes (slows brute force / credential stuffing).
- **Manual reminders:** 20/minute (prevents WhatsApp spam / cost blowups).
- `app.set('trust proxy', 1)` ensures the real client IP is used behind Render's proxy.
- Provider **webhooks are intentionally not rate-limited** (they retry) — they're protected by
  signature verification instead.

## Transport & headers
- **Helmet** sets secure HTTP headers (incl. HSTS over HTTPS); `x-powered-by` is disabled.
- **CORS** is locked to `FRONTEND_ORIGIN` (exact origins or `*.` wildcard subdomains). Use a
  specific origin in production — avoid `*` once your frontend URL is known.

## Payloads
- JSON bodies capped at **100 kb**; webhook raw body capped at **1 mb**.

## Webhooks (Razorpay)
- The raw body is verified with an **HMAC-SHA256 signature** (`RAZORPAY_WEBHOOK_SECRET`) using a
  constant-time comparison — forged webhooks are rejected.
- **Idempotent:** each event id is recorded in the `webhook_events` table and processed once, so
  retries/duplicates can't double-apply.

## Internal job endpoints
- `/internal/jobs/*` require a shared secret in the `x-internal-secret` header, compared in
  **constant time** (`crypto.timingSafeEqual`).

## Secrets & configuration
- All secrets come from **environment variables**; `.env` is git-ignored (only `.env.example` is
  committed).
- In **production the server refuses to boot** with a missing/weak/default `JWT_SECRET` or
  `INTERNAL_JOB_SECRET` (must be a strong random value, ≥ 16 chars).
- Database access is through **Prisma** (parameterized queries) — no string-built SQL, so no SQL
  injection surface.
- PAN / bank / full WhatsApp numbers are never logged.

## Data integrity
- Money is stored as integer **paise** (no floating-point drift).
- Deleting a student is a **soft delete** — payment history is preserved.

## Operational checklist
- [ ] Set a strong, unique `JWT_SECRET` and `INTERNAL_JOB_SECRET` (generated, not reused).
- [ ] Set `FRONTEND_ORIGIN` to your exact frontend URL(s) (not `*`).
- [ ] Keep `RAZORPAY_WEBHOOK_SECRET` in sync between Razorpay and Render.
- [ ] Rotate any secret/password that was ever shared in chat, screenshots, or logs.
- [ ] Use Razorpay **live** keys only after KYC; keep test and live keys separate.
- [ ] Keep dependencies updated.

## Reporting
For a real deployment, add a contact here for responsible disclosure of any vulnerability.
