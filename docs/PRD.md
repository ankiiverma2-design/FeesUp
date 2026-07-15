# PRD — Product Requirements Document

**Product:** FeesUp
**Tagline:** Collect. Track. Relax.

## 1. Problem
Home tutors in India (typically 15–40 students) track fee payments with a mix of memory,
WhatsApp chats, and paper notebooks. Every month they must manually ask parents "did you
pay?" — leading to awkward conversations, missed payments, and no reliable records.

## 2. Solution
A web app that automates the fee-collection workflow: student management, automated WhatsApp
reminders, and UPI/Razorpay payment collection in one dashboard.

## 3. Target users
- **Primary:** Individual home tutors in India managing ~15–40 students.
- **Secondary (future):** Small coaching classes / tuition centres.
- Not technical; use a phone/laptop; live on WhatsApp; value time and avoiding awkward
  money conversations.

## 4. Goals & success metrics
- Cut monthly "did you pay?" follow-ups to near zero.
- Give tutors a real-time, reliable record of who paid and who hasn't.
- Success signals: % fees collected on time, reminders sent automatically, tutor retention,
  conversion from free to paid tier.

## 5. Monetisation (locked: Model B for launch)
- **Free tier:** up to 10 students.
- **Paid tier:** ₹99–299/month for unlimited students.
- **Launch model — Model B (SaaS-only):** each tutor connects their own Razorpay account;
  payments go directly to the tutor. Platform earns from the subscription.
- **Deferred — Model A:** Razorpay Route split (platform takes 1% per payment). Requires
  Route access + per-tutor KYC, so it is postponed to avoid blocking launch.

## 6. Feature set
1. **Authentication** — tutor signup/login (email + password), JWT, isolated per-tutor data.
2. **Student management** — add/edit/delete; fields: student name, parent name, parent
   WhatsApp, monthly fee, fee due date. Dashboard table view.
3. **Fee tracking dashboard** — monthly status per student (Pending/Paid/Overdue), new
   records each month, colour indicators, summary cards (expected, collected, pending,
   defaulters).
4. **Payment link generation** — Razorpay Payment Links per student per month; studentId +
   month stored in Razorpay `notes`; shareable via WhatsApp.
5. **WhatsApp reminders** — PayPerWA; three templates (pre-due 3 days before, due date,
   overdue 3 days after); each message has student name, amount, month, payment link; manual
   trigger available.
6. **Payment webhook** — Razorpay webhook auto-matches via `notes`, marks Paid, stores
   timestamp + transaction id.
7. **Tutor onboarding** — bank details + PAN (for Route, Model A phase).
8. **Subscription & monetisation** — free vs paid tier enforcement.

## 7. Scope by phase (summary — see Phases.md)
- **Phase 0 + 1 (done):** foundations + core fee tracking, no external dependencies.
- **Phase 2:** Razorpay payment links + webhook (test mode).
- **Phase 3:** PayPerWA reminders + templates + scheduled sweep.
- **Phase 4:** subscription billing + onboarding + optional Route/1% split.

## 8. Out of scope (for now)
- Multi-tutor organisations / staff roles.
- In-app chat, attendance, or class scheduling.
- Native mobile apps (responsive web only).
- Analytics beyond the summary cards.

## 9. Key user flow
Tutor signs up → adds students → app generates monthly fee records → reminders auto-sent via
WhatsApp before the due date → parent taps link → pays via UPI → Razorpay webhook fires →
student auto-marked Paid → tutor sees a real-time dashboard of who paid and who hasn't.

## 10. Non-functional requirements
- Money stored as integer paise; timestamps UTC with IST business logic.
- Secrets via env vars only; passwords hashed; JWT auth; rate-limited auth.
- Multi-tenant isolation enforced on every query.
- Portable, standard stack so the project can continue in any IDE/agent.
