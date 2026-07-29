# Build FeesUp in Lovable — paste this brief

**How to use:** Start a new Lovable project and paste the prompt below into the chat. Let Lovable
build the app with its own stack (React + Tailwind + Supabase for database/auth). This repo's
`docs/` (PRD, Design, Architecture) and `backend/openapi.yaml` are reference material.

> The third-party accounts (Razorpay, PayPerWA) and Meta WhatsApp template approval are the only
> things you must set up yourself — see steps at the end.

---

## Prompt to paste into Lovable

> Build a web app called **FeesUp** (tagline: "Collect. Track. Relax.") — a tuition-fee manager
> for home tutors in India. Use React + Tailwind for the frontend and **Supabase** for the
> database and authentication. Build it mobile-friendly.
>
> **Theme (dark):** background #111111, surface #1A1A1A, accent green #00D97E, white text, Inter
> font. Status colors: paid = green #00D97E, overdue = red #F0453A, pending = yellow #F5B83D.
>
> **Auth:** tutors sign up / log in with email + password (Supabase Auth). Each tutor only sees
> their own data (row-level security by tutor/user id).
>
> **Data model (Supabase tables):**
> - `students`: id, tutor_id, student_name, parent_name, parent_whatsapp (e.g. +9198...),
>   monthly_fee (store rupees), fee_due_day (1–28), is_active (soft delete), created_at.
> - `fee_records`: id, student_id, tutor_id, month (1–12), year, amount, status
>   ('pending' | 'paid'), payment_link, paid_at, transaction_id. Unique (student_id, month, year).
> - `reminders`: id, fee_record_id, student_id, tutor_id, type ('pre_due'|'due'|'overdue'),
>   status, sent_at.
> - Tutor profile fields: name, phone, pan_number, bank_account, ifsc, subscription_plan
>   ('free'|'pro').
>
> **Screens:**
> 1. **Login / Signup.**
> 2. **Dashboard:** four summary cards — Total expected this month, Collected, Pending (all in ₹),
>    and Defaulters (count). A month switcher. A table of students showing name, parent, monthly
>    fee, due day, and a color-coded status badge (Paid/Pending/Overdue). Row actions: mark
>    paid/pending, copy payment link, send WhatsApp reminder, edit, delete. An "Add student" modal.
> 3. **Settings:** plan & usage (Free = up to 10 students, Pro = unlimited) with an upgrade
>    button, and a profile form (name, phone, PAN, bank account, IFSC).
>
> **Business rules:**
> - Create one `fee_records` row per active student for the current month if it doesn't exist.
> - Status is stored as pending/paid; **"overdue" is derived** = unpaid AND today is past the
>   due date (compute dates in Asia/Kolkata / IST).
> - Free tier caps active students at 10 — block adding an 11th with a clear "Upgrade" message.
> - Format all money as Indian Rupees (₹) in the UI.
>
> **Payments (add after the core app works):** use Razorpay Payment Links. Add a Supabase Edge
> Function to (a) create a payment link for a fee record and (b) receive Razorpay's
> `payment_link.paid` webhook, verify its signature, and mark the matching fee record as paid
> (match using student id + month + year stored in the link's notes). Razorpay keys go in
> Supabase secrets; start in Razorpay TEST mode.
>
> **WhatsApp reminders (add last):** send templated WhatsApp messages via a provider (PayPerWA)
> from a scheduled Edge Function: pre-due (3 days before due), due (on due date), overdue (3 days
> after). Each message includes parent name, student name, amount, month, and the payment link.
> Also allow a manual "send reminder" button per student. Requires pre-approved WhatsApp
> templates (Meta) — until then, stub the send so the rest works.
>
> Build the core app first (auth + students + dashboard + settings), then add payments, then
> WhatsApp. Keep it clean and simple.

---

## After Lovable builds it — your setup (accounts only)
1. **Supabase:** Lovable will connect this for you (auth + database).
2. **Razorpay:** create an account, use TEST keys, add them to Supabase secrets, and set the
   webhook to your Edge Function URL. (Real money later needs KYC + live keys.)
3. **PayPerWA + Meta:** create an account and submit the 3 WhatsApp templates for approval
   (texts are in `docs/WhatsAppTemplates.md`). Add the API key to Supabase secrets.

That's it — accounts and clicks only. Lovable handles all the code.
