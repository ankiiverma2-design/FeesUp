# Rules — Boundaries for AI/Contributors

These rules keep the codebase consistent and safe. Follow them when adding or changing code.

## Libraries — use
- **Backend:** Express, Prisma, zod (validation), jsonwebtoken, bcryptjs, helmet, cors,
  express-rate-limit, morgan, dotenv.
- **Frontend:** React, React Router, Axios, Tailwind CSS.
- Prefer the libraries already in `package.json`. If a new dependency is genuinely needed,
  choose a well-maintained, popular package and note why in the PR.

## Libraries — avoid
- No alternate ORMs/query builders alongside Prisma (no Sequelize, Knex, TypeORM).
- No alternate HTTP clients on the frontend besides Axios (don't mix in fetch wrappers).
- No UI kit that fights the custom Tailwind theme (no Material UI / Bootstrap). Small
  headless primitives are fine if justified.
- No state-management library yet (Redux/Zustand) — React context is sufficient at this size.
- Don't call vendor SDKs (Razorpay/PayPerWA) directly from routes — always go through the
  provider adapters.

## Error handling
- Throw `ApiError` (see `utils/errors.js`) with a proper status code; never leak stack traces
  to clients. The central error handler formats `{ error: { message, code?, fields? } }`.
- Wrap async route handlers in `asyncHandler` so rejections reach the error middleware.
- Validate all input with zod via the `validate` middleware; never trust request bodies.
- On the frontend, surface errors with `apiErrorMessage(err)`; show inline, user-friendly
  messages — no raw error dumps.

## Security & multi-tenancy (non-negotiable)
- `tutorId` comes ONLY from the verified JWT — never from the request body or query.
- Every data query must be scoped by `tutorId`.
- Passwords hashed with bcrypt; never logged or returned. Strip `passwordHash` before sending
  a tutor to the client.
- Secrets only via env vars; never commit `.env`. Keep `.env.example` in sync.
- Don't log PAN, bank details, or full WhatsApp numbers.
- Rate-limit auth (and later, reminder) endpoints.

## Data conventions
- Money is **integer paise** everywhere in code/DB. Convert to ₹ only for display.
  API accepts `monthlyFee` in rupees for convenience and converts to paise on write.
- Timestamps stored in **UTC**; compute due dates / month boundaries in **Asia/Kolkata**.
- Fee status stored `PENDING | PAID`. Do NOT persist `OVERDUE` — derive it from the due date.
- Deleting a student is a **soft delete** (`isActive = false`) to preserve history.
- Fee-record generation must stay **idempotent** (rely on the unique constraint / upsert).

## Do
- Keep routes thin; put logic in `services/`.
- Reuse a generated payment link for a month (store its id) rather than regenerating.
- Add DB changes via Prisma migrations, not manual SQL.
- Keep the mock providers working so the app runs offline.

## Don't
- Don't add tests unless requested (none required so far) — but don't break existing behaviour.
- Don't push directly to `main`; use a feature branch + PR.
- Don't introduce breaking API changes without updating the frontend and Memory.md.
- Don't hardcode secrets, base URLs, or environment-specific values.
