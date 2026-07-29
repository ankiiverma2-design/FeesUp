# Integrations — Razorpay & WhatsApp (detailed guide)

Both integrations are **already built** behind provider adapters and controlled by environment
variables in Render. Turning them on = create the account, paste keys into Render, save. No code
changes are needed (the one exception: confirming PayPerWA's request shape — covered below).

Replace `https://feesup-api.onrender.com` throughout with your actual Render API URL.

**Contents**
- [Part A — Razorpay (payments)](#part-a--razorpay-payments)
- [Part B — WhatsApp via PayPerWA](#part-b--whatsapp-via-payperwa)
- [Part C — Automatic reminders (scheduler)](#part-c--automatic-reminders-scheduler)
- [Switching back to mock](#switching-back-to-mock)
- [Rotate secrets](#rotate-secrets)

---

## Part A — Razorpay (payments)

FeesUp uses **Razorpay Payment Links**: for each unpaid fee record you generate a link, share it
with the parent, they pay by UPI/card, and a **webhook** auto-marks the student Paid. You can
build and fully test this in **Test Mode with no KYC**; real money later needs KYC + live keys.

### A1. Create the account and get TEST keys
1. Sign up at **razorpay.com**.
2. Top-left, make sure the mode toggle is set to **Test Mode**.
3. Go to **Settings → API Keys → Generate Test Key**.
4. Copy both values:
   - **Key ID** — looks like `rzp_test_XXXXXXXXXXXX`
   - **Key Secret** — shown once; copy it now.

### A2. Turn Razorpay on in Render
Render → your `feesup-api` service → **Environment** → set:

| Variable | Value |
|---|---|
| `PAYMENT_PROVIDER` | `razorpay` |
| `RAZORPAY_KEY_ID` | `rzp_test_XXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | your key secret |

Click **Save Changes** — Render auto-redeploys.

### A3. Set up the webhook (this is what auto-marks students Paid)
1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. **Webhook URL:** `https://feesup-api.onrender.com/api/webhooks/razorpay`
3. **Secret:** type any random string (e.g. `feesup-wh-4821`) and remember it.
4. **Active events:** tick **`payment_link.paid`**.
5. **Create Webhook.**
6. Back in Render → **Environment** → add:
   | Variable | Value |
   |---|---|
   | `RAZORPAY_WEBHOOK_SECRET` | the same secret from step 3 |
   - Save (auto-redeploys).

### A4. Test the full flow (Test Mode)
1. In the app, open a student and click **Get link** → you now get a **real** Razorpay test link.
2. Open the link and pay using Razorpay test details, e.g.:
   - **Test card:** `4111 1111 1111 1111`, any future expiry, any CVV.
   - Or **test UPI:** `success@razorpay`.
3. On success, Razorpay sends the `payment_link.paid` webhook → the student **auto-flips to Paid**,
   with `paidAt` and the transaction id recorded.
4. If it doesn't flip, see Troubleshooting below.

### A5. Go live with real money (later)
1. Complete Razorpay **KYC** (business/individual details, bank account, PAN).
2. Switch the dashboard to **Live Mode** → generate **Live** keys (`rzp_live_...`).
3. In Render, replace `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` with the live keys.
4. Recreate the webhook in Live mode (same URL + event) and update `RAZORPAY_WEBHOOK_SECRET`.

### A6. Troubleshooting
- **Student didn't flip to Paid:** confirm the webhook URL is exact, `payment_link.paid` is
  ticked, and `RAZORPAY_WEBHOOK_SECRET` in Render matches the secret in Razorpay. Check the
  `webhook_events` table — every received event is logged there.
- **401/auth errors creating a link:** the `RAZORPAY_KEY_ID`/`SECRET` are wrong or from the wrong
  mode (test vs live).
- **Link works but nothing happens after paying:** the webhook didn't reach the server — check the
  Razorpay webhook "recent deliveries" for failures.

### A7. Under the hood
- `src/providers/payment/RazorpayPaymentProvider.js` — creates Payment Links (studentId + month +
  year + feeRecordId are stored in the link's `notes` for matching) and verifies webhook HMAC
  signatures.
- `POST /api/webhooks/razorpay` (raw-body signature check + idempotency via the `webhook_events`
  table) → marks the matching fee record Paid.

---

## Part B — WhatsApp via PayPerWA

### ⚠️ Read this first — API vs dashboard
PayPerWA is marketed primarily as a **bulk WhatsApp *marketing*** tool (a UI wizard: pick
template → choose audience → send), running on Meta's official Cloud API. FeesUp instead needs to
send **individual, automatically-triggered utility messages via an API** (one parent, on their due
date). So the make-or-break question is:

> **Does your PayPerWA account expose an API key + a "send message" endpoint?**

- **Yes** → follow B1–B7 below and we wire PayPerWA in.
- **No (dashboard/campaigns only)** → PayPerWA won't fit automated reminders; use an **API-first
  provider** instead (see [Backup providers](#b8-backup-providers-if-no-send-api)). Switching is
  easy because everything is behind our `MessagingProvider` adapter.

Note: any provider you pick sits on Meta's Cloud API, so **pre-approved templates are always
required** for business-initiated messages — that part doesn't change.

### B1. Create the account + add wallet balance
1. Sign up at **payperwa.com**.
2. Add a small wallet balance (pay-per-message, ~20 paise each; ₹50–100 is enough to test).

### B2. Connect your WhatsApp Business number
1. In PayPerWA, start **Connect WhatsApp** — it launches Meta's embedded signup.
2. Requirements:
   - A **Meta / Facebook Business** account.
   - A phone number **not currently on a personal WhatsApp** (or remove WhatsApp from it first).
3. Verify via OTP. This creates your **WhatsApp Business Account (WABA)** linked to PayPerWA.

### B3. Create & submit the 3 templates for Meta approval
1. In PayPerWA's **Templates** section, create three **Utility** templates.
2. Use the exact texts from **`docs/WhatsAppTemplates.md`**:
   - `fee_pre_due_reminder`, `fee_due_reminder`, `fee_overdue_reminder`
   - Variables, in order: parent name, student name, amount, month, payment link.
3. Submit → wait for **Meta approval** (hours to a couple of days). Start this early — it's the
   only step outside your control.

### B4. Get your API credentials 🔑
In the PayPerWA dashboard, look for **Developer / API / API Keys / Integrations**:
- Copy the **API key** and the **API base URL**.
- Find their **"send template message"** endpoint documentation.
- If there is no API section (only the campaign wizard), skip to
  [Backup providers](#b8-backup-providers-if-no-send-api).

### B5. Confirm the send format (small code tweak)
Paste the provider's "send template message" example (endpoint URL, headers, JSON body) and adjust
`src/providers/messaging/PayPerWAMessagingProvider.js` to match. Push to `main` → Render
auto-redeploys. The current adapter assumes `POST {baseUrl}/messages` with a Bearer token and a
`{ to, type:'template', template:{ name, language, variables } }` body — tweak as needed.

### B6. Turn WhatsApp on in Render
Render → `feesup-api` → **Environment**:

| Variable | Value |
|---|---|
| `MESSAGING_PROVIDER` | `payperwa` |
| `PAYPERWA_API_KEY` | your key |
| `PAYPERWA_BASE_URL` | the API base URL |

Save (auto-redeploys).

### B7. Test
1. Click **Remind** on a student → a real WhatsApp message should reach the parent (name, amount,
   month, payment link).
2. For automatic daily sending, set up the scheduler in [Part C](#part-c--automatic-reminders-scheduler).

### B8. Backup providers (if no send-API)
Because everything is behind the `MessagingProvider` adapter, swapping is painless. API-first
options that work well in India:
- **Meta WhatsApp Cloud API directly** — free API, pay Meta per message; send via
  `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages` with a permanent token.
- **AiSensy, Interakt, Wati, Gupshup, 360dialog** — all provide proper send APIs.

Tell me which you choose and a new adapter (e.g. `MetaCloudMessagingProvider.js`) gets added; the
rest of the app is unchanged — you just set `MESSAGING_PROVIDER` to the new value.

### B9. Under the hood
- `src/providers/messaging/PayPerWAMessagingProvider.js` — sends by approved template name +
  ordered variables.
- `src/config/reminderTemplates.js` — template names + variable order + preview text.
- `src/lib/reminderLogic.js` — picks the reminder type by IST date (pre-due = 3 days before,
  due = due day, overdue = 3+ days past).

---

## Part C — Automatic reminders (scheduler)

The manual **Remind** button works once WhatsApp is on. To send reminders **automatically**
(daily) and generate fee records **monthly**, enable the included GitHub Actions cron:

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   | Secret | Value |
   |---|---|
   | `API_URL` | `https://feesup-api.onrender.com` |
   | `INTERNAL_JOB_SECRET` | the same value set in Render |
2. `.github/workflows/scheduled-jobs.yml` then runs:
   - **Daily (~09:00 IST):** `POST /internal/jobs/send-reminders`
   - **Monthly (1st):** `POST /internal/jobs/generate-fee-records`
3. Test it anytime from the repo's **Actions** tab → run the workflow manually.

---

## Switching back to mock
Set `PAYMENT_PROVIDER=mock` and/or `MESSAGING_PROVIDER=mock` in Render to disable the live
integrations — the app keeps working with simulated links/sends. Useful for testing the flow
without spending money or messages.

## Rotate secrets
If any keys/passwords were shared in chats or screenshots during setup, rotate them once you're
live: reset the Supabase DB password, regenerate `JWT_SECRET` / `INTERNAL_JOB_SECRET`, and update
Render (and the GitHub `INTERNAL_JOB_SECRET` secret to match).
