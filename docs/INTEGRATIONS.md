# Integrations — turning on Razorpay & WhatsApp

Both integrations are **already built** behind provider adapters and controlled by environment
variables. Turning them on = create the account, paste keys into Render, save. **No code changes**
(the one possible exception is confirming PayPerWA's request shape — see below).

Replace `https://feesup-api.onrender.com` below with your actual Render API URL.

---

## 🟢 Razorpay (payments)

### 1. Create account & get test keys
- Sign up at razorpay.com and stay in **Test Mode** (no KYC needed to test).
- **Settings → API Keys → Generate Test Key** → copy the **Key ID** (`rzp_test_...`) and **Key Secret**.

### 2. Turn it on in Render (`feesup-api` → Environment)
| Variable | Value |
|---|---|
| `PAYMENT_PROVIDER` | `razorpay` |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` |
| `RAZORPAY_KEY_SECRET` | your key secret |

### 3. Webhook (auto-marks a student Paid on payment)
- Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**
- **URL:** `https://feesup-api.onrender.com/api/webhooks/razorpay`
- **Active event:** `payment_link.paid`
- Set a **Secret** (any random string), then in Render add:
  | Variable | Value |
  |---|---|
  | `RAZORPAY_WEBHOOK_SECRET` | the same secret |
- **Save** in Render → it auto-redeploys.

### 4. Test
- Click **Get link** on a student → it's now a real Razorpay test link.
- Pay it with a Razorpay test card/UPI → the webhook fires → the student auto-marks **Paid**
  with the transaction id.

### 5. Real money (later)
- Complete Razorpay **KYC**, switch to **Live** keys (`rzp_live_...`), and update the same
  variables + webhook URL.

### How it works under the hood
- `src/providers/payment/RazorpayPaymentProvider.js` creates Payment Links and verifies webhook
  signatures. Matching is done via the link's `notes` (feeRecordId, studentId, month, year).
- Webhook route: `POST /api/webhooks/razorpay` (raw-body HMAC verification + idempotency via the
  `webhook_events` table).

---

## 🟢 WhatsApp (PayPerWA)

### 1. Create account
- Sign up at payperwa.com → get your **API key** and **API base URL**.

### 2. Get templates approved (start early — the only slow step)
- Submit the **3 templates** from `docs/WhatsAppTemplates.md` (pre-due / due / overdue) for
  **Meta approval**. Approval typically takes hours to a couple of days.

### 3. Confirm the request shape
- Double-check PayPerWA's send-message request/response format against their current docs and,
  if needed, adjust `src/providers/messaging/PayPerWAMessagingProvider.js` (push → Render
  auto-redeploys). Usually a small tweak.

### 4. Turn it on in Render (→ Environment)
| Variable | Value |
|---|---|
| `MESSAGING_PROVIDER` | `payperwa` |
| `PAYPERWA_API_KEY` | your key |
| `PAYPERWA_BASE_URL` | your base URL |
- **Save** → auto-redeploys.

### 5. Test
- Click **Remind** on a student → a real WhatsApp message goes to the parent (name, amount,
  month, payment link).

### How it works under the hood
- `src/providers/messaging/PayPerWAMessagingProvider.js` sends by approved template name + ordered
  variables. Template names/variable order live in `src/config/reminderTemplates.js`.
- Reminder types are chosen by `src/lib/reminderLogic.js` (pre-due = 3 days before, due = due day,
  overdue = 3+ days past), all computed in IST.

---

## ⏰ Automatic daily reminders (the scheduler)
For reminders to send **automatically** (not just via the manual "Remind" button), enable the
included GitHub Actions cron:

- GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
  | Secret | Value |
  |---|---|
  | `API_URL` | `https://feesup-api.onrender.com` |
  | `INTERNAL_JOB_SECRET` | the same value set in Render |
- `.github/workflows/scheduled-jobs.yml` then runs:
  - **Daily** (~09:00 IST): `POST /internal/jobs/send-reminders`
  - **Monthly** (1st): `POST /internal/jobs/generate-fee-records`
- You can also trigger it manually from the repo's **Actions** tab.

---

## Switching back to mock (for testing)
Set `PAYMENT_PROVIDER=mock` and/or `MESSAGING_PROVIDER=mock` in Render to disable the live
integrations again — the app keeps working with simulated links/sends.

## Reminder: rotate secrets
If any keys/passwords were shared in chat or screenshots during setup, rotate them once live
(reset the Supabase DB password, regenerate `JWT_SECRET`/`INTERNAL_JOB_SECRET`) and update Render.
