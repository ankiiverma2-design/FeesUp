# FeesUp API Reference (for building the frontend in Lovable)

The FeesUp backend is a REST API. Build the UI in Lovable and point it at this API. The full
machine-readable contract is in `backend/openapi.yaml` (also served live at
`GET {API_URL}/openapi.yaml`).

## Conventions
- **Base URL:** your deployed API, e.g. `https://your-api.onrender.com` (local: `http://localhost:4000`).
- **Auth:** JWT Bearer. After signup/login you get a `token`; send it as
  `Authorization: Bearer <token>` on every `/api/*` call (except signup/login).
- **Money:** all amounts are returned in **paise** (integer). Divide by 100 for rupees when
  displaying (`₹` format). When creating/updating a student, send `monthlyFee` in **rupees**.
- **Status colors:** `PAID` = green, `OVERDUE` = red, `PENDING` = yellow. `OVERDUE` is computed
  by the server (unpaid + past due date) — you just render the `status` field.
- **Errors:** non-2xx responses look like `{ "error": { "message": "...", "code": "...", "fields": [...] } }`.

## Endpoints (summary)

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` | `{ token, tutor }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, tutor }` |
| GET | `/api/auth/me` | – | `{ tutor }` |

### Students
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/students` | – | `{ students: [...] }` |
| POST | `/api/students` | `{ studentName, parentName, parentWhatsapp, monthlyFee(rupees), feeDueDay }` | `{ student }` |
| PATCH | `/api/students/:id` | partial student | `{ student }` |
| DELETE | `/api/students/:id` | – | `204` (soft delete) |

Free tier caps active students at 10 → POST returns `403` with `code: FREE_TIER_LIMIT`.

### Dashboard
| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/dashboard` | `month`, `year` (optional; default current IST month) | `{ period, summary, rows }` |

- `summary`: `{ totalExpected, totalCollected, totalPending, defaulters, studentCount }` (paise)
- `rows[]`: `{ studentId, studentName, parentName, parentWhatsapp, feeDueDay, feeRecordId, amount(paise), status(PENDING|PAID|OVERDUE), paidAt, transactionId, paymentLink }`

### Fee records
| Method | Path | Body | Returns |
|---|---|---|---|
| PATCH | `/api/fee-records/:id/status` | `{ status: "PAID" \| "PENDING" }` | `{ feeRecord }` |
| POST | `/api/fee-records/:id/payment-link` | – | `{ paymentLink, razorpayPaymentLinkId, reused }` |
| POST | `/api/fee-records/:id/remind` | – | `{ reminderType, status, providerMessageId }` |

### Tutor & subscription
| Method | Path | Body | Returns |
|---|---|---|---|
| PATCH | `/api/tutor/profile` | `{ name?, phone?, panNumber?, bankAccount?, ifsc? }` | `{ tutor }` |
| GET | `/api/subscription` | – | `{ plan, planName, price, status, studentLimit, studentCount, plans }` |
| POST | `/api/subscription/upgrade` | – | subscription status |
| POST | `/api/subscription/cancel` | – | subscription status |

---

## Screens to build in Lovable
1. **Login / Signup** — email + password; store the returned `token`; redirect to Dashboard.
2. **Dashboard** — 4 summary cards (Expected / Collected / Pending / Defaulters), a month
   switcher, and a students table with color-coded status. Row actions: mark paid/pending,
   get/copy payment link, send reminder, edit, delete. "Add student" modal.
3. **Settings** — plan & billing (current plan, usage x/limit, upgrade/downgrade) + profile
   form (name, phone, PAN, bank, IFSC).

## Theme (match the brand)
- Background `#111111`, surface `#1A1A1A`, accent green `#00D97E`, text white `#FFFFFF`.
- Status: paid green `#00D97E`, overdue red `#F0453A`, pending yellow `#F5B83D`.
- Font: Inter. Tagline: "Collect. Track. Relax."

---

## Copy-paste prompt for Lovable

> Build a React + Tailwind frontend for "FeesUp", a tuition-fee manager for home tutors.
> It talks to an existing REST API (do NOT create a new backend / Supabase). Base URL comes
> from an env var `VITE_API_URL`. Auth is JWT: POST `/api/auth/signup` and `/api/auth/login`
> return `{ token, tutor }`; store the token and send `Authorization: Bearer <token>` on all
> other requests. Import the OpenAPI spec from `{API_URL}/openapi.yaml` for exact shapes.
>
> Screens: (1) Login & Signup. (2) Dashboard — GET `/api/dashboard?month=&year=` returns
> `{ period, summary, rows }`; show four summary cards (Expected, Collected, Pending in ₹, and
> Defaulters count) and a table of `rows` with color-coded status (PAID green, OVERDUE red,
> PENDING yellow). Row actions: PATCH `/api/fee-records/:id/status` to toggle paid/pending,
> POST `/api/fee-records/:id/payment-link` then copy the returned link, POST
> `/api/fee-records/:id/remind` to send a WhatsApp reminder, plus edit and delete. An
> "Add student" modal POSTs to `/api/students` with `{ studentName, parentName,
> parentWhatsapp, monthlyFee, feeDueDay }` where monthlyFee is in RUPEES. A month switcher
> refetches the dashboard. (3) Settings — GET `/api/subscription` for plan + usage with
> upgrade/cancel buttons (POST `/api/subscription/upgrade|cancel`), and a profile form that
> PATCHes `/api/tutor/profile`.
>
> IMPORTANT: all money from the API is in paise (integer) — divide by 100 and format as INR
> for display. Theme: dark background #111111, surface #1A1A1A, green accent #00D97E, white
> text, Inter font, tagline "Collect. Track. Relax." Handle API errors by showing
> `error.message` from the JSON response.

After Lovable deploys, add its domain to the backend's `FRONTEND_ORIGIN` (supports
`*.lovableproject.com` wildcards) so CORS allows it.
